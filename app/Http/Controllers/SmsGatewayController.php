<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SmsGatewayController extends Controller
{
    public function adminStatus(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && (PermissionCatalog::has($actor, 'marketing.sms.send') || PermissionCatalog::has($actor, 'marketing.sms.gateway.manage')), 403);
        $this->requireTables();

        $devices = DB::table('sms_gateway_devices')
            ->where('active', true)
            ->orderByDesc('last_seen_at')
            ->limit(10)
            ->get(['id', 'name', 'active', 'last_seen_at', 'created_at']);

        $campaigns = DB::table('sms_campaigns')
            ->orderByDesc('id')
            ->limit(30)
            ->get(['id', 'message', 'status', 'recipients_count', 'sent_count', 'failed_count', 'confirmed_at', 'started_at', 'completed_at', 'created_at']);

        return response()->json([
            'devices' => $devices,
            'campaigns' => $campaigns,
        ]);
    }

    public function createPairingCode(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && PermissionCatalog::has($actor, 'marketing.sms.gateway.manage'), 403);
        $this->requireTables();

        DB::table('sms_gateway_pairings')->where('expires_at', '<', now())->delete();

        do {
            $code = (string) random_int(100000, 999999);
            $hash = hash('sha256', $code);
        } while (DB::table('sms_gateway_pairings')->where('code_hash', $hash)->exists());

        $expiresAt = now()->addMinutes(10);
        DB::table('sms_gateway_pairings')->insert([
            'code_hash' => $hash,
            'created_by' => $actor->id,
            'expires_at' => $expiresAt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'code' => $code,
            'expires_at' => $expiresAt->toISOString(),
        ], 201);
    }

    public function createCampaign(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor && PermissionCatalog::has($actor, 'marketing.sms.send'), 403);
        $this->requireTables();

        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:1200'],
        ]);

        $recipients = User::query()
            ->where('role', 'customer')
            ->whereNotNull('phone')
            ->where('phone', '!=', '')
            ->get(['id', 'phone'])
            ->map(fn (User $user) => [
                'user_id' => $user->id,
                'phone' => $this->normalizeSyrianPhone((string) $user->phone),
            ])
            ->filter(fn (array $row) => $row['phone'] !== null)
            ->unique('phone')
            ->values();

        // Guests: numbers collected automatically from orders.
        if (Schema::hasTable('marketing_contacts')) {
            $known = $recipients->pluck('phone')->all();
            foreach (DB::table('marketing_contacts')->pluck('phone') as $guestPhone) {
                $guestPhone = $this->normalizeSyrianPhone((string) $guestPhone);
                if ($guestPhone && ! in_array($guestPhone, $known, true)) {
                    $known[] = $guestPhone;
                    $recipients->push(['user_id' => null, 'phone' => $guestPhone]);
                }
            }
            $recipients = $recipients->values();
        }

        abort_if($recipients->isEmpty(), 422, 'No eligible customer phone numbers were found.');

        $campaignId = DB::transaction(function () use ($actor, $data, $recipients) {
            $campaignId = DB::table('sms_campaigns')->insertGetId([
                'created_by' => $actor->id,
                'message' => trim($data['message']),
                'status' => 'pending_confirmation',
                'recipients_count' => $recipients->count(),
                'sent_count' => 0,
                'failed_count' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $rows = $recipients->map(fn (array $row) => [
                'campaign_id' => $campaignId,
                'user_id' => $row['user_id'],
                'phone' => $row['phone'],
                'status' => 'queued',
                'attempts' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ])->all();

            foreach (array_chunk($rows, 500) as $chunk) {
                DB::table('sms_campaign_recipients')->insert($chunk);
            }

            return $campaignId;
        });

        return response()->json([
            'message' => 'Campaign created. Confirm it once on the Android gateway to start sending.',
            'campaign_id' => $campaignId,
            'recipients' => $recipients->count(),
            'status' => 'pending_confirmation',
        ], 201);
    }

    public function pair(Request $request): JsonResponse
    {
        $this->requireTables();
        $data = $request->validate([
            'code' => ['required', 'digits:6'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $pairing = DB::table('sms_gateway_pairings')
            ->where('code_hash', hash('sha256', $data['code']))
            ->whereNull('consumed_at')
            ->where('expires_at', '>=', now())
            ->first();

        abort_unless($pairing, 422, 'Invalid or expired pairing code.');

        $plainToken = Str::random(80);
        $deviceId = DB::transaction(function () use ($pairing, $plainToken, $data, $request) {
            DB::table('sms_gateway_pairings')->where('id', $pairing->id)->update([
                'consumed_at' => now(),
                'updated_at' => now(),
            ]);

            return DB::table('sms_gateway_devices')->insertGetId([
                'name' => trim((string) ($data['device_name'] ?? 'Android SMS Gateway')) ?: 'Android SMS Gateway',
                'token_hash' => hash('sha256', $plainToken),
                'paired_by' => $pairing->created_by,
                'active' => true,
                'last_seen_at' => now(),
                'last_ip' => substr((string) $request->ip(), 0, 64),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'device_id' => $deviceId,
            'token' => $plainToken,
            'message' => 'Device paired.',
        ], 201);
    }

    public function pending(Request $request): JsonResponse
    {
        $device = $this->device($request);
        $campaign = DB::table('sms_campaigns')
            ->where('status', 'pending_confirmation')
            ->orderBy('id')
            ->first(['id', 'message', 'recipients_count', 'created_at']);

        return response()->json([
            'device' => ['id' => $device->id, 'name' => $device->name],
            'campaign' => $campaign,
        ]);
    }

    public function confirm(Request $request, int $campaign): JsonResponse
    {
        $device = $this->device($request);
        $row = DB::table('sms_campaigns')->where('id', $campaign)->first();
        abort_unless($row, 404);

        if ($row->status === 'pending_confirmation') {
            DB::table('sms_campaigns')->where('id', $campaign)->update([
                'status' => 'sending',
                'device_id' => $device->id,
                'confirmed_at' => now(),
                'started_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            abort_unless($row->status === 'sending' && (int) $row->device_id === (int) $device->id, 409, 'Campaign is already being handled by another device or is no longer pending.');
        }

        return response()->json(['ok' => true, 'campaign_id' => $campaign, 'status' => 'sending']);
    }

    public function nextBatch(Request $request, int $campaign): JsonResponse
    {
        $device = $this->device($request);
        $limit = max(1, min(25, (int) $request->query('limit', 15)));

        $campaignRow = DB::table('sms_campaigns')->where('id', $campaign)->first();
        abort_unless($campaignRow, 404);
        abort_unless($campaignRow->status === 'sending' && (int) $campaignRow->device_id === (int) $device->id, 409, 'Campaign is not assigned to this device.');

        $rows = DB::transaction(function () use ($campaign, $limit) {
            DB::table('sms_campaign_recipients')
                ->where('campaign_id', $campaign)
                ->where('status', 'sending')
                ->where('updated_at', '<', now()->subMinutes(10))
                ->update(['status' => 'queued', 'updated_at' => now()]);

            $rows = DB::table('sms_campaign_recipients')
                ->where('campaign_id', $campaign)
                ->where('status', 'queued')
                ->orderBy('id')
                ->limit($limit)
                ->lockForUpdate()
                ->get(['id', 'phone']);

            if ($rows->isNotEmpty()) {
                DB::table('sms_campaign_recipients')
                    ->whereIn('id', $rows->pluck('id'))
                    ->update([
                        'status' => 'sending',
                        'attempts' => DB::raw('attempts + 1'),
                        'updated_at' => now(),
                    ]);
            }

            return $rows;
        });

        if ($rows->isEmpty()) {
            $this->finalizeCampaignIfDone($campaign);
        }

        $fresh = DB::table('sms_campaigns')->where('id', $campaign)->first(['status', 'sent_count', 'failed_count', 'recipients_count']);

        return response()->json([
            'campaign_id' => $campaign,
            'status' => $fresh->status,
            'message' => $campaignRow->message,
            'recipients' => $rows,
            'progress' => [
                'sent' => (int) $fresh->sent_count,
                'failed' => (int) $fresh->failed_count,
                'total' => (int) $fresh->recipients_count,
            ],
        ]);
    }

    public function recipientResult(Request $request, int $campaign, int $recipient): JsonResponse
    {
        $device = $this->device($request);
        $data = $request->validate([
            'status' => ['required', 'in:sent,failed'],
            'error' => ['nullable', 'string', 'max:1000'],
        ]);

        $campaignRow = DB::table('sms_campaigns')->where('id', $campaign)->first();
        abort_unless($campaignRow, 404);
        abort_unless((int) $campaignRow->device_id === (int) $device->id, 403);

        DB::transaction(function () use ($campaign, $recipient, $data) {
            $row = DB::table('sms_campaign_recipients')
                ->where('id', $recipient)
                ->where('campaign_id', $campaign)
                ->lockForUpdate()
                ->first();
            abort_unless($row, 404);

            if (in_array($row->status, ['sent', 'failed'], true)) return;

            DB::table('sms_campaign_recipients')->where('id', $recipient)->update([
                'status' => $data['status'],
                'error' => $data['status'] === 'failed' ? trim((string) ($data['error'] ?? 'Unknown SMS error')) : null,
                'sent_at' => $data['status'] === 'sent' ? now() : null,
                'updated_at' => now(),
            ]);

            DB::table('sms_campaigns')->where('id', $campaign)->update([
                $data['status'] === 'sent' ? 'sent_count' : 'failed_count' => DB::raw(($data['status'] === 'sent' ? 'sent_count' : 'failed_count').' + 1'),
                'updated_at' => now(),
            ]);
        });

        $this->finalizeCampaignIfDone($campaign);
        return response()->json(['ok' => true]);
    }

    private function device(Request $request): object
    {
        $this->requireTables();
        $token = trim((string) $request->bearerToken());
        abort_if($token === '', 401, 'Missing gateway token.');

        $device = DB::table('sms_gateway_devices')
            ->where('token_hash', hash('sha256', $token))
            ->where('active', true)
            ->first();
        abort_unless($device, 401, 'Invalid gateway token.');

        DB::table('sms_gateway_devices')->where('id', $device->id)->update([
            'last_seen_at' => now(),
            'last_ip' => substr((string) $request->ip(), 0, 64),
            'updated_at' => now(),
        ]);

        return $device;
    }

    private function finalizeCampaignIfDone(int $campaignId): void
    {
        $remaining = DB::table('sms_campaign_recipients')
            ->where('campaign_id', $campaignId)
            ->whereIn('status', ['queued', 'sending'])
            ->count();
        if ($remaining > 0) return;

        $campaign = DB::table('sms_campaigns')->where('id', $campaignId)->first();
        if (! $campaign || in_array($campaign->status, ['completed', 'partial', 'failed'], true)) return;

        $status = $campaign->failed_count > 0
            ? ($campaign->sent_count > 0 ? 'partial' : 'failed')
            : 'completed';

        DB::transaction(function () use ($campaignId, $campaign, $status) {
            DB::table('sms_campaigns')->where('id', $campaignId)->update([
                'status' => $status,
                'completed_at' => now(),
                'updated_at' => now(),
            ]);

            if (Schema::hasTable('marketing_broadcasts')) {
                DB::table('marketing_broadcasts')->insert([
                    'sent_by' => $campaign->created_by,
                    'channel' => 'sms',
                    'subject' => null,
                    'message' => $campaign->message,
                    'recipients_count' => $campaign->recipients_count,
                    'success_count' => $campaign->sent_count,
                    'failed_count' => $campaign->failed_count,
                    'status' => $status,
                    'meta' => json_encode(['sms_campaign_id' => $campaignId]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    private function normalizeSyrianPhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';
        if (str_starts_with($digits, '00963')) $digits = substr($digits, 2);
        if (str_starts_with($digits, '963')) {
            $local = substr($digits, 3);
        } elseif (str_starts_with($digits, '09')) {
            $local = substr($digits, 1);
        } elseif (str_starts_with($digits, '9')) {
            $local = $digits;
        } else {
            return null;
        }

        if (! preg_match('/^9\d{8}$/', $local)) return null;
        return '+963'.$local;
    }

    private function requireTables(): void
    {
        abort_unless(
            Schema::hasTable('sms_gateway_devices') && Schema::hasTable('sms_campaigns') && Schema::hasTable('sms_campaign_recipients'),
            503,
            'SMS Gateway migration has not been run yet.'
        );
    }
}
