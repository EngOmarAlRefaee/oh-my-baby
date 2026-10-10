<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionShare extends Model
{
    protected $fillable = [
        'commission_transfer_id', 'order_id', 'admin_user_id',
        'amount_usd', 'paid_usd', 'status', 'reversed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:4',
            'paid_usd' => 'decimal:4',
            'reversed_at' => 'datetime',
        ];
    }

    public function commission(): BelongsTo { return $this->belongsTo(CommissionTransfer::class, 'commission_transfer_id'); }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function admin(): BelongsTo { return $this->belongsTo(User::class, 'admin_user_id'); }
    public function ledgerEntries(): HasMany { return $this->hasMany(FinancialLedgerEntry::class, 'commission_share_id'); }
}
