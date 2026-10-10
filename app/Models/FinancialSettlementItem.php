<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialSettlementItem extends Model
{
    protected $fillable = ['settlement_id', 'ledger_entry_id', 'amount_usd'];

    protected function casts(): array
    {
        return ['amount_usd' => 'decimal:4'];
    }

    public function settlement(): BelongsTo { return $this->belongsTo(FinancialSettlement::class); }
    public function ledgerEntry(): BelongsTo { return $this->belongsTo(FinancialLedgerEntry::class); }
}


