<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_external_id', 'source_admin_user_id', 'catalog_product_id', 'name_ar', 'name_en', 'image',
        'color_id', 'color_name', 'size', 'inventory_key', 'quantity', 'unit_price_usd',
        'line_total_usd', 'category', 'sections', 'is_offer', 'returned_quantity', 'return_requested_quantity',
    ];

    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'is_offer' => 'boolean',
            'unit_price_usd' => 'decimal:2',
            'line_total_usd' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function sourceAdmin(): BelongsTo { return $this->belongsTo(User::class, 'source_admin_user_id'); }
    public function catalogProduct(): BelongsTo { return $this->belongsTo(CatalogProduct::class); }
}


