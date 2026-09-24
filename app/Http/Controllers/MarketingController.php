<?php

namespace App\Http\Controllers;

use App\Models\InterestPollVote;
use App\Models\NewsletterSubscriber;
use App\Models\PromoCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class MarketingController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $this->ensureEngagementTables();
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:190']]);
        $email = mb_strtolower(trim($data['email']));
        $existing = NewsletterSubscriber::query()->where('email', $email)->first();

        $row = NewsletterSubscriber::updateOrCreate(
            ['email' => $email],
            ['active' => true, 'subscribed_at' => now(), 'unsubscribed_at' => null]
        );

        $accountEmail = mb_strtolower(trim((string) ($request->user()?->email ?? '')));

        return response()->json([
            'message' => 'Subscribed.',
            'subscriber' => $row,
            'already_subscribed' => (bool) ($existing?->active),
            'recognized_account' => $accountEmail !== '' && $accountEmail === $email,
        ], $existing?->active ? 200 : 201);
    }

    public function publicPromo(): JsonResponse
    {
        $this->ensureEngagementTables();
        $promo = PromoCode::query()
            ->where('active', true)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->latest('updated_at')
            ->first();

        return response()->json(['promo' => $promo]);
    }

    public function bestSellers(): JsonResponse
    {
        $products = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', 'delivered')
            ->select('order_items.product_external_id', DB::raw('SUM(order_items.quantity) as sold_count'))
            ->groupBy('order_items.product_external_id')
            ->orderByDesc('sold_count')
            ->limit(50)
            ->get();

        return response()->json(['products' => $products]);
    }

    public function vote(Request $request): JsonResponse
    {
        $this->ensureEngagementTables();
        $data = $request->validate([
            'section' => ['required', 'string', 'max:80'],
            'choice' => ['required', 'in:yes,no,interested,very_interested'],
        ]);

        $sessionKey = hash('sha256', $request->session()->getId());
        $choice = match ($data['choice']) {
            'yes' => 'interested',
            'no' => 'very_interested',
            default => $data['choice'],
        };

        $vote = InterestPollVote::updateOrCreate(
            ['section' => $data['section'], 'session_key' => $sessionKey],
            ['choice' => $choice, 'user_id' => $request->user()?->id]
        );

        return response()->json([
            'ok' => true,
            'vote' => $vote,
            'results' => $this->pollStats($data['section']),
        ]);
    }

    public function pollResults(Request $request): JsonResponse
    {
        $this->ensureEngagementTables();
        $data = $request->validate([
            'section' => ['required', 'string', 'max:80'],
        ]);

        $sessionKey = hash('sha256', $request->session()->getId());
        $choice = InterestPollVote::query()
            ->where('section', $data['section'])
            ->where('session_key', $sessionKey)
            ->value('choice');

        return response()->json([
            'results' => $this->pollStats($data['section']),
            'choice' => $choice,
        ]);
    }

    public function submitFeedback(Request $request): JsonResponse
    {
        $this->ensureEngagementTables();

        $data = $request->validate([
            'source' => ['nullable', 'string', 'max:80'],
            'message' => ['required', 'string', 'min:3', 'max:1200'],
        ]);

        DB::table('customer_feedback')->insert([
            'source' => $data['source'] ?? 'website',
            'message' => trim($data['message']),
            'user_id' => $request->user()?->id,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
            'status' => 'new',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['message' => 'Feedback received.'], 201);
    }

    public function adminIndex(): JsonResponse
    {
        $this->ensureEngagementTables();
        $polls = InterestPollVote::query()
            ->select('section', 'choice', DB::raw('COUNT(*) as votes'))
            ->groupBy('section', 'choice')
            ->get();

        return response()->json([
            'promo_codes' => PromoCode::latest()->get(),
            'subscribers' => NewsletterSubscriber::where('active', true)->latest()->limit(1000)->get(),
            'polls' => $polls,
            'feedback' => DB::table('customer_feedback')->latest()->limit(100)->get(),
        ]);
    }

    public function savePromo(Request $request): JsonResponse
    {
        $this->ensureEngagementTables();
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'discount_percent' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'active' => ['required', 'boolean'],
            'first_order_only' => ['nullable', 'boolean'],
        ]);

        $code = strtoupper(trim($data['code']));
        $promo = PromoCode::updateOrCreate(
            ['code' => $code],
            [
                'discount_percent' => $data['discount_percent'],
                'active' => (bool) $data['active'],
                'first_order_only' => (bool) ($data['first_order_only'] ?? false),
            ]
        );

        // Keep one public promo active at a time so the header and checkout always agree.
        if ($promo->active) {
            PromoCode::where('id', '!=', $promo->id)->update(['active' => false]);
        } else {
            PromoCode::query()->update(['active' => false]);
        }

        return response()->json(['promo' => $promo]);
    }

    private function ensureEngagementTables(): void
    {
        if (! Schema::hasTable('promo_codes')) {
            Schema::create('promo_codes', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->decimal('discount_percent', 5, 2);
                $table->boolean('active')->default(true)->index();
                $table->boolean('first_order_only')->default(false);
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->timestamps();
            });

            DB::table('promo_codes')->insert([
                'code' => 'BABY10',
                'discount_percent' => 10,
                'active' => true,
                'first_order_only' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (! Schema::hasTable('newsletter_subscribers')) {
            Schema::create('newsletter_subscribers', function (Blueprint $table) {
                $table->id();
                $table->string('email')->unique();
                $table->boolean('active')->default(true)->index();
                $table->timestamp('subscribed_at')->nullable();
                $table->timestamp('unsubscribed_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('interest_poll_votes')) {
            Schema::create('interest_poll_votes', function (Blueprint $table) {
                $table->id();
                $table->string('section', 80)->index();
                $table->string('choice', 30)->index();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('session_key', 120)->index();
                $table->timestamps();
                $table->unique(['section', 'session_key']);
            });
        }

        // Repair interrupted/local migrations without deleting existing data.
        if (! Schema::hasColumn('newsletter_subscribers', 'active')) {
            Schema::table('newsletter_subscribers', fn (Blueprint $table) => $table->boolean('active')->default(true)->index());
        }
        if (! Schema::hasColumn('newsletter_subscribers', 'subscribed_at')) {
            Schema::table('newsletter_subscribers', fn (Blueprint $table) => $table->timestamp('subscribed_at')->nullable());
        }
        if (! Schema::hasColumn('newsletter_subscribers', 'unsubscribed_at')) {
            Schema::table('newsletter_subscribers', fn (Blueprint $table) => $table->timestamp('unsubscribed_at')->nullable());
        }

        if (! Schema::hasColumn('interest_poll_votes', 'choice')) {
            Schema::table('interest_poll_votes', fn (Blueprint $table) => $table->string('choice', 30)->default('yes')->index());
        }
        if (! Schema::hasColumn('interest_poll_votes', 'session_key')) {
            Schema::table('interest_poll_votes', fn (Blueprint $table) => $table->string('session_key', 120)->nullable()->index());
        }
        if (! Schema::hasColumn('interest_poll_votes', 'user_id')) {
            Schema::table('interest_poll_votes', fn (Blueprint $table) => $table->unsignedBigInteger('user_id')->nullable()->index());
        }

        if (! Schema::hasTable('customer_feedback')) {
            Schema::create('customer_feedback', function (Blueprint $table) {
                $table->id();
                $table->string('source', 80)->default('website')->index();
                $table->text('message');
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('ip_address', 80)->nullable();
                $table->string('user_agent', 500)->nullable();
                $table->string('status', 30)->default('new')->index();
                $table->timestamps();
            });
        }

    }

    private function pollStats(string $section): array
    {
        $counts = InterestPollVote::query()
            ->where('section', $section)
            ->select('choice', DB::raw('COUNT(*) as votes'))
            ->groupBy('choice')
            ->pluck('votes', 'choice');

        $interested = (int) (($counts['interested'] ?? 0) + ($counts['yes'] ?? 0));
        $veryInterested = (int) (($counts['very_interested'] ?? 0) + ($counts['no'] ?? 0));
        $total = $interested + $veryInterested;

        return [
            'section' => $section,
            'interested' => $interested,
            'very_interested' => $veryInterested,
            'total' => $total,
            'interested_percent' => $total > 0 ? (int) round(($interested / $total) * 100) : 0,
            'very_interested_percent' => $total > 0 ? (int) round(($veryInterested / $total) * 100) : 0,

            // Backward-compatible names for older frontend builds.
            'yes' => $interested,
            'no' => $veryInterested,
            'yes_percent' => $total > 0 ? (int) round(($interested / $total) * 100) : 0,
            'no_percent' => $total > 0 ? (int) round(($veryInterested / $total) * 100) : 0,
        ];
    }
}
