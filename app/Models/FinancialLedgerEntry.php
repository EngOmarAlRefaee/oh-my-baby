<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialLedgerEntry extends Model
{
    protected $fillable = [
        'account_user_id', 'order_id', 'commission_transfer_id', 'commission_share_id', 'settlement_id',
        'created_by_user_id', 'type', 'amount_usd', 'idempotency_key', 'description', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
            'meta' => 'array',
        ];
    }

    public function account(): BelongsTo { return $this->belongsTo(User::class, 'account_user_id'); }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function commission(): BelongsTo { return $this->belongsTo(CommissionTransfer::class, 'commission_transfer_id'); }
    public function commissionShare(): BelongsTo { return $this->belongsTo(CommissionShare::class, 'commission_share_id'); }
    public function settlement(): BelongsTo { return $this->belongsTo(FinancialSettlement::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }
    public function settlementItems(): HasMany { return $this->hasMany(FinancialSettlementItem::class, 'ledger_entry_id'); }
}


