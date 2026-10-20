<?php

namespace App\Support;

use App\Models\FinancialLedgerEntry;
use App\Models\User;
use App\Services\FinancialLedgerService;
use Illuminate\Support\Carbon;

/**
 * An Admin is locked out of the workspace when commission debt that accrued up to the
 * end of the last Friday is still unpaid. The Owner confirming receipt unlocks them.
 */
class CommissionLock
{
    public static function enabled(): bool
    {
        return (bool) config('ohmybaby.commissions.lock_on_overdue', true);
    }

    public static function cutoff(): Carbon
    {
        // Most recent Saturday 00:00 (= end of the last Friday), in the app timezone.
        return now()->timezone(config('app.timezone', 'UTC'))->startOfWeek(Carbon::SATURDAY);
    }

    public static function overdueUsd(User $user): float
    {
        if ($user->role !== 'admin') return 0.0;

        $before = (float) FinancialLedgerEntry::query()
            ->where('account_user_id', $user->id)
            ->where('created_at', '<', self::cutoff()->copy()->utc())
            ->sum('amount_usd');
        $overdueBefore = max(0.0, -$before);
        $due = app(FinancialLedgerService::class)->dueFor($user);

        return round(min($due, $overdueBefore), 4);
    }

    public static function isLocked(?User $user): bool
    {
        if (! $user || ! self::enabled()) return false;
        if (\App\Support\PermissionCatalog::has($user, 'commissions.lock_exempt')) return false;
        return self::overdueUsd($user) > 0.001;
    }
}
