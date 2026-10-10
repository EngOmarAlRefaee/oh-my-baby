<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SupportConversationController extends Controller
{
    public function create(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->role !== 'customer') {
            return response()->json([
                'message' => 'حسابات العمل تستخدم صندوق الدعم من لوحة التحكم.',
            ], 403);
        }

        $data = $request->validate([
            'guest_name' => [Rule::requiredIf(! $user), 'nullable', 'string', 'max:160'],
            'message' => ['required', 'string', 'min:1', 'max:3000'],
            'order_id' => ['nullable', 'integer'],
        ]);

        $order = $this->resolveOrderForParticipant($user, $data['order_id'] ?? null);

        $conversation = DB::transaction(function () use ($user, $data, $order): SupportConversation {
            $conversation = SupportConversation::create([
                'public_token' => Str::random(64),
                'user_id' => $user?->id,
                'order_id' => $order?->id,
                'guest_name' => $user ? null : trim((string) ($data['guest_name'] ?? '')),
                'guest_phone' => null,
                'subject' => null,
                'status' => 'open',
                'unread_for_staff' => 1,
                'unread_for_customer' => 0,
                'last_message_at' => now(),
            ]);

            $conversation->messages()->create([
                'sender_user_id' => $user?->id,
                'sender_type' => $user ? 'customer' : 'guest',
                'body' => trim($data['message']),
            ]);

            return $conversation;
        });

        return response()->json([
            'conversation' => $this->participantPayload($conversation->fresh(), true),
        ], 201);
    }

    public function claimGuest(Request $request, SupportConversation $conversation): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'customer', 403);

        $data = $request->validate([
            'token' => ['required', 'string', 'max:160'],
        ]);

        $claimed = DB::transaction(function () use ($conversation, $user, $data): SupportConversation {
            $locked = SupportConversation::query()
                ->whereKey($conversation->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->user_id) {
                abort_unless((int) $locked->user_id === (int) $user->id, 403);
                return $locked;
            }

            $token = (string) $data['token'];
            abort_unless($token !== '' && hash_equals((string) $locked->public_token, $token), 403);

            $locked->messages()
                ->where('sender_type', 'guest')
                ->update([
                    'sender_type' => 'customer',
                    'sender_user_id' => $user->id,
                ]);

            $locked->forceFill([
                'user_id' => $user->id,
                // Rotate the guest token so the old browser token cannot access the claimed thread.
                'public_token' => Str::random(64),
            ])->save();

            return $locked;
        });

        return response()->json([
            'conversation' => $this->participantPayload($claimed->fresh(), true),
        ]);
    }

    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && $user->role === 'customer', 403);

        $conversations = SupportConversation::query()
            ->where('user_id', $user->id)
            ->with(['lastMessage.sender:id,name,role', 'order:id,reference'])
            ->latest('last_message_at')
            ->get()
            ->map(fn (SupportConversation $conversation) => $this->participantPayload($conversation, false));

        return response()->json(['conversations' => $conversations]);
    }

    public function showParticipant(Request $request, SupportConversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);

        if (! $request->boolean('peek')) {
            DB::transaction(function () use ($conversation): void {
                $conversation->forceFill(['unread_for_customer' => 0])->save();

                $conversation->messages()
                    ->where('sender_type', 'staff')
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            });
        }

        $conversation->load([
            'messages.sender:id,name,role',
            'messages.replyTo.sender:id,name,role',
            'order:id,reference',
        ]);

        return response()->json([
            'conversation' => $this->participantPayload($conversation, true),
        ]);
    }

    public function replyParticipant(Request $request, SupportConversation $conversation): JsonResponse
    {
        $this->authorizeParticipant($request, $conversation);

        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:3000'],
            'reply_to_message_id' => [
                'nullable',
                'integer',
                Rule::exists('support_messages', 'id')
                    ->where(fn ($query) => $query->where('support_conversation_id', $conversation->id)),
            ],
        ]);

        $user = $request->user();

        DB::transaction(function () use ($conversation, $user, $data): void {
            $conversation->messages()->create([
                'sender_user_id' => $user?->id,
                'reply_to_message_id' => $data['reply_to_message_id'] ?? null,
                'sender_type' => $user ? 'customer' : 'guest',
                'body' => trim($data['message']),
            ]);

            $conversation->forceFill([
                'status' => 'open',
                'unread_for_staff' => $conversation->unread_for_staff + 1,
                'last_message_at' => now(),
                'closed_at' => null,
            ])->save();
        });

        return $this->showParticipant($request, $conversation->fresh());
    }

    public function staffIndex(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = SupportConversation::query()
            ->with([
                'user:id,name,email,phone',
                'order:id,reference',
                'assignedTo:id,name,role',
                'lastMessage.sender:id,name,role',
            ])
            ->latest('last_message_at');

        if (is_string($status) && in_array($status, ['open', 'waiting_customer', 'closed'], true)) {
            $query->where('status', $status);
        }

        $conversations = $query->limit(250)->get()
            ->map(fn (SupportConversation $conversation) => $this->staffPayload($conversation, false));

        return response()->json([
            'conversations' => $conversations,
            'summary' => $this->staffSummaryPayload(),
        ]);
    }

    public function staffSummary(): JsonResponse
    {
        return response()->json($this->staffSummaryPayload());
    }

    public function staffShow(SupportConversation $conversation): JsonResponse
    {
        DB::transaction(function () use ($conversation): void {
            $conversation->forceFill(['unread_for_staff' => 0])->save();

            $conversation->messages()
                ->whereIn('sender_type', ['customer', 'guest'])
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        });

        $conversation->load([
            'user:id,name,email,phone',
            'order:id,reference',
            'assignedTo:id,name,role',
            'messages.sender:id,name,role',
            'messages.replyTo.sender:id,name,role',
        ]);

        return response()->json([
            'conversation' => $this->staffPayload($conversation, true),
        ]);
    }

    public function staffReply(Request $request, SupportConversation $conversation): JsonResponse
    {
        if ($conversation->status === 'closed') {
            return response()->json([
                'message' => 'أعد فتح المحادثة قبل إرسال رد جديد.',
                'code' => 'conversation_closed',
            ], 409);
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:3000'],
            'reply_to_message_id' => [
                'nullable',
                'integer',
                Rule::exists('support_messages', 'id')
                    ->where(fn ($query) => $query->where('support_conversation_id', $conversation->id)),
            ],
        ]);

        DB::transaction(function () use ($request, $conversation, $data): void {
            $conversation->messages()->create([
                'sender_user_id' => $request->user()->id,
                'reply_to_message_id' => $data['reply_to_message_id'] ?? null,
                'sender_type' => 'staff',
                'body' => trim($data['message']),
            ]);

            $conversation->forceFill([
                'assigned_to_user_id' => $conversation->assigned_to_user_id ?: $request->user()->id,
                'status' => 'waiting_customer',
                'unread_for_customer' => $conversation->unread_for_customer + 1,
                'last_message_at' => now(),
            ])->save();
        });

        return $this->staffShow($conversation->fresh());
    }

    public function assign(Request $request, SupportConversation $conversation): JsonResponse
    {
        $data = $request->validate([
            'assigned_to_user_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
        ]);

        $assignee = null;
        if (! empty($data['assigned_to_user_id'])) {
            $assignee = User::findOrFail($data['assigned_to_user_id']);

            if (! in_array($assignee->role, ['owner', 'admin'], true)
                || ($assignee->role === 'admin' && ! PermissionCatalog::has($assignee, 'support.view'))
                || ($assignee->account_status ?? 'active') !== 'active') {
                return response()->json([
                    'message' => 'لا يمكن تعيين المحادثة لهذا الحساب.',
                ], 422);
            }
        }

        $conversation->forceFill([
            'assigned_to_user_id' => $assignee?->id,
        ])->save();

        return $this->staffShow($conversation->fresh());
    }

    public function close(SupportConversation $conversation): JsonResponse
    {
        $conversation->forceFill([
            'status' => 'closed',
            'closed_at' => now(),
            'unread_for_staff' => 0,
        ])->save();

        return $this->staffShow($conversation->fresh());
    }

    public function reopen(SupportConversation $conversation): JsonResponse
    {
        $conversation->forceFill([
            'status' => 'open',
            'closed_at' => null,
        ])->save();

        return $this->staffShow($conversation->fresh());
    }

    public function staffAssignees(): JsonResponse
    {
        $users = User::query()
            ->where('account_status', 'active')
            ->whereIn('role', ['owner', 'admin'])
            ->orderByRaw("CASE WHEN role = 'owner' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'permissions'])
            ->filter(fn (User $user) => $user->role === 'owner' || PermissionCatalog::has($user, 'support.view'))
            ->values()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ]);

        return response()->json(['users' => $users]);
    }

    private function authorizeParticipant(Request $request, SupportConversation $conversation): void
    {
        $user = $request->user();

        if ($user) {
            abort_unless($user->role === 'customer' && (int) $conversation->user_id === (int) $user->id, 403);
            return;
        }

        $token = (string) ($request->header('X-Support-Token') ?: $request->query('token') ?: $request->input('token'));
        abort_unless($token !== '' && hash_equals((string) $conversation->public_token, $token), 403);
        abort_unless(is_null($conversation->user_id), 403);
    }

    private function resolveOrderForParticipant(?User $user, ?int $orderId): ?Order
    {
        if (! $user || ! $orderId) {
            return null;
        }

        return Order::query()
            ->whereKey($orderId)
            ->where('user_id', $user->id)
            ->firstOrFail();
    }

    private function participantPayload(SupportConversation $conversation, bool $withMessages): array
    {
        $conversation->loadMissing(['order:id,reference', 'lastMessage.sender:id,name,role']);

        $payload = [
            'id' => $conversation->id,
            'token' => $conversation->public_token,
            'status' => $conversation->status,
            'subject' => $conversation->subject,
            'order' => $conversation->order ? [
                'id' => $conversation->order->id,
                'reference' => $conversation->order->reference,
            ] : null,
            'unread' => (int) $conversation->unread_for_customer,
            'last_message_at' => optional($conversation->last_message_at)->toIso8601String(),
            'last_message' => $conversation->lastMessage ? [
                'body' => $conversation->lastMessage->body,
                'sender_type' => $conversation->lastMessage->sender_type,
                'created_at' => $conversation->lastMessage->created_at?->toIso8601String(),
            ] : null,
        ];

        if ($withMessages) {
            $conversation->loadMissing([
                'messages.sender:id,name,role',
                'messages.replyTo.sender:id,name,role',
            ]);
            $payload['messages'] = $conversation->messages
                ->sortBy('id')
                ->values()
                ->map(fn (SupportMessage $message) => $this->messagePayload($message))
                ->all();
        }

        return $payload;
    }

    private function staffPayload(SupportConversation $conversation, bool $withMessages): array
    {
        $conversation->loadMissing([
            'user:id,name,email,phone',
            'order:id,reference',
            'assignedTo:id,name,role',
            'lastMessage.sender:id,name,role',
        ]);

        $payload = [
            'id' => $conversation->id,
            'status' => $conversation->status,
            'subject' => $conversation->subject,
            'customer' => $conversation->user ? [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
                'email' => $conversation->user->email,
                'phone' => $conversation->user->phone,
                'guest' => false,
            ] : [
                'id' => null,
                'name' => $conversation->guest_name,
                'email' => null,
                'phone' => $conversation->guest_phone,
                'guest' => true,
            ],
            'order' => $conversation->order ? [
                'id' => $conversation->order->id,
                'reference' => $conversation->order->reference,
            ] : null,
            'assigned_to' => $conversation->assignedTo ? [
                'id' => $conversation->assignedTo->id,
                'name' => $conversation->assignedTo->name,
                'role' => $conversation->assignedTo->role,
            ] : null,
            'unread' => (int) $conversation->unread_for_staff,
            'last_message_at' => optional($conversation->last_message_at)->toIso8601String(),
            'last_message' => $conversation->lastMessage ? [
                'body' => $conversation->lastMessage->body,
                'sender_type' => $conversation->lastMessage->sender_type,
                'created_at' => $conversation->lastMessage->created_at?->toIso8601String(),
            ] : null,
        ];

        if ($withMessages) {
            $conversation->loadMissing([
                'messages.sender:id,name,role',
                'messages.replyTo.sender:id,name,role',
            ]);
            $payload['messages'] = $conversation->messages
                ->sortBy('id')
                ->values()
                ->map(fn (SupportMessage $message) => $this->messagePayload($message))
                ->all();
        }

        return $payload;
    }

    private function messagePayload(SupportMessage $message): array
    {
        return [
            'id' => $message->id,
            'sender_type' => $message->sender_type,
            'sender_name' => $message->sender?->name,
            'body' => $message->body,
            'reply_to' => $message->replyTo ? [
                'id' => $message->replyTo->id,
                'sender_type' => $message->replyTo->sender_type,
                'sender_name' => $message->replyTo->sender?->name,
                'body' => Str::limit($message->replyTo->body, 240),
            ] : null,
            'created_at' => $message->created_at?->toIso8601String(),
            'read_at' => $message->read_at?->toIso8601String(),
        ];
    }

    private function staffSummaryPayload(): array
    {
        return [
            'unread' => (int) SupportConversation::query()->sum('unread_for_staff'),
            'open' => SupportConversation::query()->where('status', 'open')->count(),
            'waiting_customer' => SupportConversation::query()->where('status', 'waiting_customer')->count(),
            'closed' => SupportConversation::query()->where('status', 'closed')->count(),
        ];
    }
}


