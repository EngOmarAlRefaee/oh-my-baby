<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoCode extends Model
{
    protected $fillable = ['code', 'discount_percent', 'active', 'first_order_only', 'starts_at', 'ends_at'];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'first_order_only' => 'boolean',
            'discount_percent' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }
}
