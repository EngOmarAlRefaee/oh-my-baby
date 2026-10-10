<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionTransfer extends Model
{
    protected $fillable = [
        'order_id', 'debtor_user_id', 'type', 'amount_usd', 'status', 'provider',
        'provider_transaction_id', 'failure_reason', 'transferred_at',
        'reversed_at', 'reversal_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount_usd' => 'decimal:2',
            'transferred_at' => 'datetime',
            'reversed_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function debtor(): BelongsTo { return $this->belongsTo(User::class, 'debtor_user_id'); }
    public function shares(): HasMany { return $this->hasMany(CommissionShare::class); }
}


