<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'external_id', 'created_by_user_id', 'payload', 'status', 'is_summer', 'is_winter',
        'sold_count', 'out_of_stock_since', 'archived_at',
    ];

    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by_user_id'); }

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'is_summer' => 'boolean',
            'is_winter' => 'boolean',
            'out_of_stock_since' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }
}


