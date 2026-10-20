<?php

namespace App\Services;

use App\Models\CommissionShare;
use App\Models\CommissionTransfer;
use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CommissionService
{
    public function __construct(
        private ShamCashService $shamCash,
        private FinancialLedgerService $ledger,
    ) {}

    public function ensureForDeliveredOrder(Order $order): CommissionTransfer
    {
        $order->loadMissing(['items', 'acceptedBy', 'events.actor']);

        // Financial debt starts only after BOTH sides confirm: Delivery has marked
        // the order delivered and the Customer has confirmed receipt.
        if (! $order->delivered_at || ! $order->customer_confirmed_at) {
            return $order->commission()->firstOrCreate(
                ['order_id' => $order->id],
                [
                    'type' => 'awaiting_customer_confirmation',
                    'amount_usd' => 0,
                    'status' => 'awaiting_confirmation',
                    'provider' => 'internal_ledger',
                ],
            );
        }

        $hasDecoration = $order->items->contains(fn ($item) => $item->category === 'decor');
        // Only an order made purely of offer items is commission-free. A mixed order
        // (offer + other section) is charged, on the non-offer pieces' owners.
        $hasOffer = $order->items->isNotEmpty() && $order->items->every(fn ($item) => (bool) $item->is_offer);

        // Decoration uses its own settlement flow.
        if ($hasDecoration) {
            return CommissionTransfer::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'debtor_user_id' => null,
                    'type' => 'decoration_deferred',
                    'amount_usd' => (float) config('ohmybaby.commissions.decoration_usd', 2.5),
                    'status' => 'deferred',
                    'provider' => 'internal_ledger',
                    'failure_reason' => null,
                ],
            );
        }

        if ($hasOffer && config('ohmybaby.commissions.exclude_orders_with_offers', true)) {
            return CommissionTransfer::updateOrCreate(
                ['order_id' => $order->id],
                [
                    'debtor_user_id' => null,
                    'type' => 'offer_excluded',
                    'amount_usd' => 0,
                    'status' => 'excluded',
                    'provider' => 'internal_ledger',
                    'failure_reason' => null,
                ],
            );
        }

        // Flat fee by piece count: 1 piece = 0.25$, 2+ pieces = 0.5$ (split between the owning Admins).
        $pieces = (int) $order->items->sum(fn ($item) => max(0, (int) $item->quantity));
        $amount = $pieces <= 1
            ? (float) config('ohmybaby.commissions.single_piece_usd', 0.25)
            : (float) config('ohmybaby.commissions.normal_order_usd', 0.5);
        $participants = $this->participantAdmins($order);
        $hasOwnershipSnapshot = $order->items->contains(fn ($item) => ! is_null($item->source_admin_user_id));

        // Backward compatibility only for genuinely old orders that have no
        // product-owner snapshot at all. Never charge the order-accepting Admin
        // for a product explicitly owned by Owner/non-Admin.
        if ($participants->isEmpty() && ! $hasOwnershipSnapshot) {
            $legacyDebtor = $this->resolveLegacyDebtor($order);
            if ($legacyDebtor) {
                $participants = collect([$legacyDebtor]);
            }
        }

        $singleDebtor = $participants->count() === 1 ? $participants->first() : null;
        $commission = CommissionTransfer::firstOrNew(['order_id' => $order->id]);
        $commission->fill([
            'debtor_user_id' => $singleDebtor?->id,
            'type' => 'normal_order',
            'amount_usd' => $amount,
            'provider' => 'internal_ledger',
            'failure_reason' => $participants->isNotEmpty()
                ? null
                : 'No product-owner Admin could be resolved for this order.',
        ]);

        if (! $commission->exists || in_array($commission->status, ['awaiting_confirmation', 'unassigned', 'pending'], true)) {
            $commission->status = $participants->isNotEmpty() ? 'pending' : 'unassigned';
        }
        $commission->save();

        if ($participants->isNotEmpty() && $amount > 0) {
            $shares = $this->syncShares($order, $commission, $participants, $amount);

            // Existing historical commissions may already have one pre-split ledger charge.
            // Do not duplicate that debt when this code is deployed over old production data.
            $hasLegacyCharge = FinancialLedgerEntry::query()
                ->where('commission_transfer_id', $commission->id)
                ->where('type', 'commission')
                ->whereNull('commission_share_id')
                ->exists();

            if (! $hasLegacyCharge) {
                foreach ($shares as $share) {
                    $this->ledger->accrueCommissionShare($order, $commission, $share);
                }
            }
        }

        return $commission->refresh()->load('shares.admin:id,name,email');
    }

    /**
     * Confirms receipt automatically for delivered orders the customer (or a guest,
     * who has no account to confirm with) never confirmed, once the configured
     * time has passed since delivery. Only orders still in the plain "delivered"
     * status are touched: an order with a pending/approved return is never
     * confirmed, and a later return still reverses the commission.
     *
     * @return int number of orders auto-confirmed
     */
    public function autoConfirmDeliveredOrders(?int $hours = null): int
    {
        $hours ??= (int) config('ohmybaby.commissions.auto_confirm_hours', 12);
        $cutoff = now()->subHours($hours);
        $confirmed = 0;

        $ids = Order::query()
            ->where('status', 'delivered')
            ->whereNotNull('delivered_at')
            ->whereNull('customer_confirmed_at')
            ->where('delivered_at', '<=', $cutoff)
            ->orderBy('id')
            ->pluck('id');

        foreach ($ids as $id) {
            DB::transaction(function () use ($id, $cutoff, $hours, &$confirmed): void {
                $order = Order::query()->whereKey($id)->lockForUpdate()->first();
                if (
                    ! $order
                    || $order->status !== 'delivered'
                    || $order->customer_confirmed_at
                    || ! $order->delivered_at
                    || $order->delivered_at->gt($cutoff)
                ) {
                    return;
                }

                $order->forceFill(['customer_confirmed_at' => now()])->save();
                $order->events()->create([
                    'actor_user_id' => null,
                    'event' => 'receipt_auto_confirmed',
                    'note' => null,
                    'meta' => ['after_hours' => $hours],
                ]);
                $this->ensureForDeliveredOrder($order->fresh());
                $confirmed++;
            });
        }

        return $confirmed;
    }

    public function attemptTransfer(CommissionTransfer $commission, ?string $pin = null): CommissionTransfer
    {
        if ((float) $commission->amount_usd <= 0) return $commission;
        if (! in_array($commission->status, ['pending', 'partially_paid'], true)) return $commission;

        $commission->update(['status' => 'processing', 'failure_reason' => null]);

        try {
            $response = $this->shamCash->transfer($commission->loadMissing('order'), $pin);
            $transactionId = data_get($response, 'data.tran_id');
            $commission->update([
                'status' => 'paid',
                'provider_transaction_id' => $transactionId ? (string) $transactionId : null,
                'transferred_at' => now(),
            ]);
        } catch (\Throwable $error) {
            $commission->update(['status' => 'pending', 'failure_reason' => $error->getMessage()]);
        }

        return $commission->refresh();
    }

    public function reverseForReturnedOrder(Order $order, string $reason = 'Order returned'): ?CommissionTransfer
    {
        $commission = $order->commission()->first();
        if (! $commission) return null;
        if (in_array($commission->status, ['excluded', 'deferred', 'reversed'], true)) return $commission;

        // Keep original debts immutable. Reversal creates positive ledger entries
        // for every Admin share that was charged on this order.
        $this->ledger->reverseCommission($commission, $reason);

        $commission->shares()->update([
            'status' => 'reversed',
            'reversed_at' => now(),
        ]);
        $commission->update([
            'status' => 'reversed',
            'reversed_at' => now(),
            'reversal_reason' => $reason,
        ]);

        return $commission->refresh()->load('shares');
    }


    /**
     * Called when the driver finishes a return and has recorded which pieces came back.
     * - everything returned  -> commission reversed for all owners
     * - nothing returned     -> unchanged
     * - partial return       -> commission stays, only owners of the remaining pieces pay
     */
    public function applyReturnOutcome(Order $order, string $reason = 'Order returned to store'): ?CommissionTransfer
    {
        $order->unsetRelation('items');
        $order->load('items');
        $items = $order->items;

        $returnedAny = $items->contains(fn ($i) => (int) $i->returned_quantity > 0);
        $keptAny = $items->contains(fn ($i) => (int) $i->returned_quantity < (int) $i->quantity);

        if (! $returnedAny) return $order->commission()->first();
        if (! $keptAny) return $this->reverseForReturnedOrder($order, $reason);

        // Partial return: the customer keeps at least one piece, so the order counts as received.
        if ($order->delivered_at && ! $order->customer_confirmed_at) {
            $order->update(['customer_confirmed_at' => now()]);
        }
        $commission = $this->ensureForDeliveredOrder($order->refresh());

        if (! in_array($commission->type, ['normal_order'], true) || $commission->status === 'reversed') {
            return $commission;
        }

        $remainingIds = $this->participantAdmins($order)->pluck('id')->map(fn ($id) => (int) $id)->all();
        $shares = $commission->shares()->get();
        if ($shares->isEmpty() || empty($remainingIds)) return $commission->refresh();

        $amount = (float) $commission->amount_usd;
        $units = (int) round($amount * 10000);
        $count = count($remainingIds);
        sort($remainingIds);
        $stamp = (string) ($order->returned_at ? \Illuminate\Support\Carbon::parse($order->returned_at)->timestamp : now()->timestamp);

        foreach ($shares as $share) {
            $adminId = (int) $share->admin_user_id;
            if (! in_array($adminId, $remainingIds, true)) {
                if ($share->status !== 'reversed') {
                    $this->ledger->reverseShare($share, $reason);
                    $share->update(['status' => 'reversed', 'reversed_at' => now()]);
                }
                continue;
            }
            $index = array_search($adminId, $remainingIds, true);
            $newUnits = intdiv($units, $count) + ($index < $units % $count ? 1 : 0);
            $newAmount = $newUnits / 10000;
            $extra = round($newAmount - (float) $share->amount_usd, 4);
            $share->update(['amount_usd' => $newAmount]);
            $this->ledger->adjustShareCharge($order, $commission, $share, $extra, $stamp);
        }

        $commission->update([
            'debtor_user_id' => $count === 1 ? $remainingIds[0] : null,
        ]);

        return $commission->refresh()->load('shares.admin:id,name,email');
    }

    /** @return Collection<int, User> */
    private function participantAdmins(Order $order): Collection
    {
        // Owners of pieces that were fully returned do not take part in the commission.
        $ids = $order->items
            ->filter(fn ($item) => ! $item->is_offer && (int) $item->returned_quantity < (int) $item->quantity)
            ->pluck('source_admin_user_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->sort()
            ->values();

        if ($ids->isEmpty()) return collect();

        $users = User::query()
            ->whereIn('id', $ids)
            ->where('role', 'admin')
            ->get()
            ->keyBy('id');

        return $ids
            ->map(fn (int $id) => $users->get($id))
            ->filter()
            ->values();
    }

    /** @return Collection<int, CommissionShare> */
    private function syncShares(Order $order, CommissionTransfer $commission, Collection $participants, float $amount): Collection
    {
        $participantIds = $participants->pluck('id')->map(fn ($id) => (int) $id)->sort()->values();
        $totalUnits = (int) round($amount * 10000);
        $count = max(1, $participantIds->count());
        $baseUnits = intdiv($totalUnits, $count);
        $remainder = $totalUnits % $count;

        $shares = collect();
        foreach ($participantIds as $index => $adminId) {
            // Keep four decimals internally: 2 Admins => 0.2500 each,
            // 4 Admins => 0.1250 each, 3 Admins => 0.1667/0.1667/0.1666.
            $units = $baseUnits + ($index < $remainder ? 1 : 0);
            $share = CommissionShare::firstOrNew([
                'commission_transfer_id' => $commission->id,
                'admin_user_id' => $adminId,
            ]);
            $share->order_id = $order->id;
            $share->amount_usd = $units / 10000;
            if (! $share->exists) {
                $share->status = 'pending';
                $share->paid_usd = 0;
            }
            $share->save();
            $shares->push($share);
        }

        return $shares;
    }

    private function resolveLegacyDebtor(Order $order): ?User
    {
        if ($order->accepted_by_user_id) {
            $actor = $order->acceptedBy;
            return $actor?->role === 'admin' ? $actor : null;
        }

        $event = $order->events
            ->where('event', 'order_accepted')
            ->sortByDesc('id')
            ->first();

        if ($event) {
            return $event->actor?->role === 'admin' ? $event->actor : null;
        }

        return User::query()
            ->where('role', 'admin')
            ->where('account_status', 'active')
            ->where('is_primary_admin', true)
            ->first()
            ?? User::query()
                ->where('role', 'admin')
                ->where('account_status', 'active')
                ->oldest('id')
                ->first();
    }
}
