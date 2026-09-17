<?php

namespace App\Services;

use App\Models\RewardCoupon;
use App\Models\User;
use Illuminate\Support\Str;

class RewardService
{
    public function syncForUser(User $user): array
    {
        $deliveredCount = $user->orders()
            ->where(function ($query) {
                $query->where('status', 'delivered')
                    ->orWhere(function ($returnQuery) {
                        $returnQuery->whereIn('status', ['return_requested', 'return_approved', 'return_assigned', 'return_in_transit'])
                            ->whereNotNull('delivered_at');
                    });
            })
            ->count();
        $tiers = collect(config('ohmybaby.rewards.tiers', []))
            ->mapWithKeys(fn ($discount, $orders) => [(int) $orders => (float) $discount])
            ->sortKeys();

        // If a delivered order is later returned, unused coupons that are no longer earned are revoked.
        $user->rewardCoupons()
            ->where('status', 'available')
            ->where('unlock_orders', '>', $deliveredCount)
            ->update(['status' => 'revoked']);

        // If the customer earns the threshold again later, restore the unused coupon.
        $user->rewardCoupons()
            ->where('status', 'revoked')
            ->where('unlock_orders', '<=', $deliveredCount)
            ->update(['status' => 'available']);

        foreach ($tiers as $threshold => $discount) {
            if ($deliveredCount < $threshold) continue;

            RewardCoupon::firstOrCreate(
                ['user_id' => $user->id, 'unlock_orders' => $threshold],
                [
                    'code' => $this->makeCode($user, $threshold),
                    'discount_percent' => $discount,
                    'status' => 'available',
                ],
            );
        }

        $next = $tiers->keys()->first(fn ($threshold) => $threshold > $deliveredCount);

        return [
            'delivered_orders' => $deliveredCount,
            'next_threshold' => $next,
            'remaining_to_next' => $next ? max(0, $next - $deliveredCount) : 0,
            'coupons' => $user->rewardCoupons()->latest()->get(),
        ];
    }

    private function makeCode(User $user, int $threshold): string
    {
        return sprintf('OMB%d-%d-%s', $threshold, $user->id, strtoupper(Str::random(5)));
    }
}
