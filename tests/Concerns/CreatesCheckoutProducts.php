<?php

namespace Tests\Concerns;

use App\Models\CatalogProduct;

trait CreatesCheckoutProducts
{
    private function createCheckoutProduct(string $externalId, float $price, int $stock = 10): CatalogProduct
    {
        return CatalogProduct::create([
            'external_id' => $externalId,
            'name_ar' => 'Test '.$externalId,
            'name_en' => 'Test '.$externalId,
            'world' => 'fashion',
            'category' => 'girls',
            'subcategory' => 'all',
            'audience' => 'all',
            'price_usd' => $price,
            'colors' => [],
            'sizes' => [],
            'inventory' => ['default::default' => $stock],
            'sections' => [],
            'status' => 'active',
        ]);
    }
}
