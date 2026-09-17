<?php

namespace App\Services;

use App\Models\CommissionTransfer;
use App\Models\Order;

class CommissionService
{
    public function __construct(private ShamCashService $shamCash) {}

    public function ensureForDeliveredOrder(Order $order): CommissionTransfer
    {
        $order->loadMissing('items');
        $hasDecoration = $order->items->contains(fn ($item) => $item->category === 'decor');
        $hasOffer = $order->items->contains(fn ($item) => (bool) $item->is_offer);

        if ($hasDecoration) {
            $type = 'decoration';
            $amount = (float) config('ohmybaby.commissions.decoration_usd', 2.5);
            $status = 'pending';
        } elseif ($hasOffer && config('ohmybaby.commissions.exclude_orders_with_offers', true)) {
            $type = 'offer_excluded';
            $amount = 0.0;
            $status = 'excluded';
        } else {
            $type = 'normal_order';
            $amount = (float) config('ohmybaby.commissions.normal_order_usd', 0.5);
            $status = 'pending';
        }

        $commission = CommissionTransfer::firstOrCreate(
            ['order_id' => $order->id],
            ['type' => $type, 'amount_usd' => $amount, 'status' => $status, 'provider' => 'sham_cash'],
        );

        if ($commission->status === 'pending' && config('ohmybaby.sham_cash.auto_transfer', false) && $this->shamCash->configured()) {
            $this->attemptTransfer($commission);
        }

        return $commission->refresh();
    }

    public function attemptTransfer(CommissionTransfer $commission, ?string $pin = null): CommissionTransfer
    {
        if ((float) $commission->amount_usd <= 0) return $commission;
        if ($commission->status !== 'pending') return $commission;

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
        if (in_array($commission->status, ['excluded', 'reversed'], true)) return $commission;

        if ($commission->status === 'paid') {
            $commission->update([
                'status' => 'reversal_required',
                'reversed_at' => now(),
                'reversal_reason' => $reason,
            ]);
        } else {
            $commission->update([
                'status' => 'reversed',
                'reversed_at' => now(),
                'reversal_reason' => $reason,
            ]);
        }

        return $commission->refresh();
    }

}
