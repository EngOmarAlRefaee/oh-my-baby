<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CatalogProduct extends Model
{
    protected $fillable = [
        'external_id', 'slug', 'world', 'category', 'subcategory', 'audience',
        'name_ar', 'name_en', 'description_ar', 'description_en', 'price_usd',
        'offer_price_usd', 'image', 'colors', 'sizes', 'inventory', 'sections',
        'status', 'low_stock_threshold', 'created_by', 'updated_by', 'product_code',
    ];

    protected static function booted(): void
    {
        // Every product gets a permanent 5-digit number (10001, 10002, ...) shown as OMB-10001.
        static::creating(function (CatalogProduct $product) {
            if (empty($product->product_code) && \Illuminate\Support\Facades\Schema::hasColumn('catalog_products', 'product_code')) {
                $product->product_code = max(10000, (int) static::query()->max('product_code')) + 1;
            }
        });
    }

    public function createdBy(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
    public function updatedBy(): BelongsTo { return $this->belongsTo(User::class, 'updated_by'); }

    protected function casts(): array
    {
        return [
            'price_usd' => 'decimal:2',
            'offer_price_usd' => 'decimal:2',
            'colors' => 'array',
            'sizes' => 'array',
            'inventory' => 'array',
            'sections' => 'array',
        ];
    }

    public function toStoreArray(): array
    {
        $labels = [
            'newborn' => ['ar' => 'الرضع', 'en' => 'Infants'],
            'girls' => ['ar' => 'بناتي', 'en' => 'Girls'],
            'boys' => ['ar' => 'صبياني', 'en' => 'Boys'],
            'shoes' => ['ar' => 'أحذية', 'en' => 'Shoes'],
            'accessories' => ['ar' => 'إكسسوارات ومستلزمات', 'en' => 'Accessories & Supplies'],
            'decor' => ['ar' => 'استقبال المولود والتزيين', 'en' => 'Newborn Welcome & Decor'],
            'mobility' => ['ar' => 'عربايات ومقاعد', 'en' => 'Strollers & Seats'],
            'gifts' => ['ar' => 'هدايا', 'en' => 'Gifts'],
            'baby-essentials' => ['ar' => 'ألعاب ومستلزمات الطفل', 'en' => 'Toys & Essentials'],
        ];
        $categoryLabel = $labels[$this->category] ?? ['ar' => $this->category, 'en' => $this->category];

        return [
            'id' => ctype_digit((string) $this->external_id) ? (int) $this->external_id : $this->external_id,
            'slug' => $this->slug,
            'code' => $this->product_code ? 'OMB-'.$this->product_code : null,
            'name' => $this->name_ar,
            'nameEn' => $this->name_en ?: $this->name_ar,
            'world' => $this->world,
            'category' => $this->category,
            'categoryAr' => $categoryLabel['ar'],
            'categoryEn' => $categoryLabel['en'],
            'subcategory' => $this->subcategory ?: 'all',
            'audience' => $this->audience ?: 'all',
            'colors' => $this->colors ?: [],
            'sizes' => $this->sizes ?: [],
            'inventory' => $this->inventory ?: [],
            'price' => (float) $this->price_usd,
            'offerPrice' => $this->offer_price_usd !== null ? (float) $this->offer_price_usd : null,
            'descriptionAr' => $this->description_ar ?: '',
            'descriptionEn' => $this->description_en ?: '',
            'image' => $this->image ?: '',
            'sections' => $this->sections ?: [],
            'status' => $this->status,
            'lowStockThreshold' => $this->low_stock_threshold,
        ];
    }
}


