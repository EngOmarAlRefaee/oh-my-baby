<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionSettlementRequest extends Model
{
    protected $fillable = [
        'account_user_id', 'resolved_by_user_id', 'financial_settlement_id',
        'amount_usd', 'week_key', 'status', 'admin_note', 'owner_note',
        'submitted_at', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
            'submitted_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo { return $this->belongsTo(User::class, 'account_user_id'); }
    public function resolvedBy(): BelongsTo { return $this->belongsTo(User::class, 'resolved_by_user_id'); }
    public function settlement(): BelongsTo { return $this->belongsTo(FinancialSettlement::class, 'financial_settlement_id'); }
}
