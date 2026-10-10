<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinancialSettlement extends Model
{
    protected $fillable = [
        'account_user_id', 'confirmed_by_user_id', 'amount_usd', 'currency',
        'amount_currency', 'exchange_rate', 'provider', 'provider_transaction_id',
        'status', 'orders_count', 'note', 'confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
            'amount_currency' => 'decimal:4',
            'exchange_rate' => 'decimal:4',
            'confirmed_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo { return $this->belongsTo(User::class, 'account_user_id'); }
    public function confirmedBy(): BelongsTo { return $this->belongsTo(User::class, 'confirmed_by_user_id'); }
    public function items(): HasMany { return $this->hasMany(FinancialSettlementItem::class, 'settlement_id'); }
    public function ledgerEntries(): HasMany { return $this->hasMany(FinancialLedgerEntry::class, 'settlement_id'); }
}


