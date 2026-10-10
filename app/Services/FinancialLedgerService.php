<?php

namespace App\Services;

use App\Models\CommissionShare;
use App\Models\CommissionTransfer;
use App\Models\FinancialLedgerEntry;
use App\Models\FinancialSettlement;
use App\Models\FinancialSettlementItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinancialLedgerService
{
    public function balanceFor(User|int $account): float
    {
        $id = $account instanceof User ? $account->id : $account;
        return round((float) FinancialLedgerEntry::where('account_user_id', $id)->sum('amount_usd'), 4);
    }

    public function dueFor(User|int $account): float
    {
        return round(max(0, -$this->balanceFor($account)), 4);
    }

    /** Legacy single-debtor accrual kept for old records. */
    public function accrueCommission(Order $order, CommissionTransfer $commission, User $debtor): FinancialLedgerEntry
    {
        return FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => 'commission:'.$commission->id],
            [
                'account_user_id' => $debtor->id,
                'order_id' => $order->id,
                'commission_transfer_id' => $commission->id,
                'type' => 'commission',
                'amount_usd' => -abs((float) $commission->amount_usd),
                'description' => 'Commission for order '.$order->reference,
                'meta' => ['commission_type' => $commission->type],
            ],
        );
    }

    public function accrueCommissionShare(Order $order, CommissionTransfer $commission, CommissionShare $share): FinancialLedgerEntry
    {
        return FinancialLedgerEntry::firstOrCreate(
            ['idempotency_key' => 'commission-share:'.$share->id],
            [
                'account_user_id' => $share->admin_user_id,
                'order_id' => $order->id,
                'commission_transfer_id' => $commission->id,
                'commission_share_id' => $share->id,
                'type' => 'commission',
                'amount_usd' => -abs((float) $share->amount_usd),
                'description' => 'Commission share for order '.$order->reference,
                'meta' => [
                    'commission_type' => $commission->type,
                    'participants' => $commission->shares()->count(),
                ],
            ],
        );
    }

    /** @return array<int, FinancialLedgerEntry> */
    public function reverseCommission(CommissionTransfer $commission, string $reason): array
    {
        $charges = FinancialLedgerEntry::query()
            ->where('commission_transfer_id', $commission->id)
            ->where('type', 'commission')
            ->where('amount_usd', '<', 0)
            ->get();

        $reversals = [];
        foreach ($charges as $charge) {
            $reversals[] = FinancialLedgerEntry::firstOrCreate(
                ['idempotency_key' => 'commission-reversal-entry:'.$charge->id],
                [
                    'account_user_id' => $charge->account_user_id,
                    'order_id' => $charge->order_id,
                    'commission_transfer_id' => $commission->id,
                    'commission_share_id' => $charge->commission_share_id,
                    'type' => 'commission_reversal',
                    'amount_usd' => abs((float) $charge->amount_usd),
                    'description' => 'Commission reversal',
                    'meta' => ['reason' => $reason],
                ],
            );
        }

        return $reversals;
    }

    public function recordSettlement(
        User $account,
        User $actor,
        float $amountUsd,
        ?string $providerTransactionId = null,
        ?string $note = null
    ): FinancialSettlement {
        if ($account->role !== 'admin') {
            throw ValidationException::withMessages(['account' => ['التسوية المالية متاحة لحسابات Admin فقط حالياً.']]);
        }

        $amountUsd = round($amountUsd, 4);
        if ($amountUsd <= 0) {
            throw ValidationException::withMessages(['amount_usd' => ['قيمة التسديد يجب أن تكون أكبر من صفر.']]);
        }

        return DB::transaction(function () use ($account, $actor, $amountUsd, $providerTransactionId, $note) {
            User::whereKey($account->id)->lockForUpdate()->firstOrFail();

            $due = $this->dueFor($account->id);
            if ($due <= 0) {
                throw ValidationException::withMessages(['amount_usd' => ['لا يوجد مبلغ مستحق على هذا الحساب حالياً.']]);
            }
            if ($amountUsd > $due + 0.001) {
                throw ValidationException::withMessages([
                    'amount_usd' => ['قيمة التسديد أكبر من المستحق الحالي وهو $'.number_format($due, 2).'.'],
                ]);
            }

            $settlement = FinancialSettlement::create([
                'account_user_id' => $account->id,
                'confirmed_by_user_id' => $actor->id,
                'amount_usd' => $amountUsd,
                'currency' => 'USD',
                'amount_currency' => $amountUsd,
                'provider' => 'manual',
                'provider_transaction_id' => $providerTransactionId ?: null,
                'status' => 'confirmed',
                'note' => $note ?: null,
                'confirmed_at' => now(),
            ]);

            FinancialLedgerEntry::create([
                'account_user_id' => $account->id,
                'settlement_id' => $settlement->id,
                'created_by_user_id' => $actor->id,
                'type' => 'settlement',
                'amount_usd' => $amountUsd,
                'idempotency_key' => 'settlement:'.$settlement->id,
                'description' => 'Confirmed commission settlement',
                'meta' => ['provider_transaction_id' => $providerTransactionId],
            ]);

            $remaining = $amountUsd;
            $ordersCount = 0;

            $charges = FinancialLedgerEntry::query()
                ->with(['commission', 'commissionShare'])
                ->where('account_user_id', $account->id)
                ->where('type', 'commission')
                ->where('amount_usd', '<', 0)
                ->oldest('id')
                ->lockForUpdate()
                ->get();

            foreach ($charges as $charge) {
                if ($remaining <= 0.0001) break;
                if (in_array($charge->commission?->status, ['reversed', 'excluded', 'deferred'], true)) continue;
                if ($charge->commissionShare?->status === 'reversed') continue;

                $alreadyAllocated = (float) FinancialSettlementItem::where('ledger_entry_id', $charge->id)->sum('amount_usd');
                $open = max(0, abs((float) $charge->amount_usd) - $alreadyAllocated);
                if ($open <= 0.0001) continue;

                $allocation = round(min($open, $remaining), 4);
                FinancialSettlementItem::create([
                    'settlement_id' => $settlement->id,
                    'ledger_entry_id' => $charge->id,
                    'amount_usd' => $allocation,
                ]);

                $ordersCount++;
                $remaining = round($remaining - $allocation, 4);

                $newAllocated = round($alreadyAllocated + $allocation, 4);
                if ($charge->commissionShare) {
                    $charge->commissionShare->update([
                        'paid_usd' => $newAllocated,
                        'status' => $newAllocated + 0.001 >= abs((float) $charge->amount_usd) ? 'paid' : 'partially_paid',
                    ]);
                    $this->refreshCommissionTransferStatus((int) $charge->commission_transfer_id);
                } elseif ($charge->commission) {
                    // Legacy single-debtor commission.
                    $charge->commission->update([
                        'status' => $newAllocated + 0.001 >= abs((float) $charge->amount_usd) ? 'paid' : 'partially_paid',
                        'transferred_at' => $newAllocated + 0.001 >= abs((float) $charge->amount_usd) ? now() : null,
                    ]);
                }
            }

            $settlement->update(['orders_count' => $ordersCount]);

            return $settlement->fresh(['account:id,name,email,phone', 'confirmedBy:id,name', 'items.ledgerEntry.order:id,reference']);
        });
    }

    private function refreshCommissionTransferStatus(int $commissionTransferId): void
    {
        $commission = CommissionTransfer::find($commissionTransferId);
        if (! $commission || in_array($commission->status, ['excluded', 'deferred', 'reversed'], true)) return;

        $shares = CommissionShare::where('commission_transfer_id', $commissionTransferId)->get();
        if ($shares->isEmpty()) return;

        if ($shares->every(fn (CommissionShare $share) => $share->status === 'paid')) {
            $commission->update(['status' => 'paid', 'transferred_at' => now()]);
            return;
        }

        if ($shares->contains(fn (CommissionShare $share) => in_array($share->status, ['paid', 'partially_paid'], true))) {
            $commission->update(['status' => 'partially_paid', 'transferred_at' => null]);
            return;
        }

        $commission->update(['status' => 'pending', 'transferred_at' => null]);
    }
}
