<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RewardCoupon extends Model
{
    protected $fillable = ['user_id', 'code', 'unlock_orders', 'discount_percent', 'status', 'used_on_order_id', 'used_at'];

    protected function casts(): array
    {
        return [
            'discount_percent' => 'decimal:2',
            'used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
