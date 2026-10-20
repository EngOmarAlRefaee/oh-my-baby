<?php

namespace Tests\Feature;

use App\Models\CatalogProduct;
use App\Services\ExchangeRateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesCheckoutProducts;
use Tests\TestCase;

class OrderStockVisibilityTest extends TestCase
{
    use RefreshDatabase;
    use CreatesCheckoutProducts;

    private function order(string $productId, int $quantity): \Illuminate\Testing\TestResponse
    {
        $this->mock(ExchangeRateService::class, function ($mock): void {
            $mock->shouldReceive('current')->andReturn(['usd_to_syp' => 10000, 'source' => 'test']);
            $mock->shouldReceive('convertUsdToSyp')->andReturn(250000);
        });

        return $this->postJson('/api/orders', [
            'customer_name' => 'Stock Customer',
            'customer_phone' => '0999000033',
            'delivery_address' => 'Stock test address',
            'payment_currency' => 'usd',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
            'items' => [[
                'product_id' => $productId,
                'color_id' => null,
                'size' => null,
                'quantity' => $quantity,
            ]],
        ]);
    }

    public function test_order_decrements_stock_and_product_stays_in_public_catalog(): void
    {
        $this->createCheckoutProduct('stock-product', 20, 5);

        $this->order('stock-product', 1)->assertCreated();

        $product = CatalogProduct::where('external_id', 'stock-product')->firstOrFail();
        $this->assertSame(4, $product->inventory['default::default']);
        $this->assertSame('active', $product->status);

        $this->getJson('/api/catalog/products')
            ->assertOk()
            ->assertJsonPath('products.0.id', 'stock-product')
            ->assertJsonPath('products.0.inventory.default::default', 4);
    }

    public function test_last_unit_ordered_keeps_product_visible_with_zero_stock(): void
    {
        $this->createCheckoutProduct('last-unit-product', 20, 1);

        $this->order('last-unit-product', 1)->assertCreated();

        $this->assertDatabaseHas('catalog_products', ['external_id' => 'last-unit-product', 'status' => 'active']);

        $this->getJson('/api/catalog/products')
            ->assertOk()
            ->assertJsonCount(1, 'products')
            ->assertJsonPath('products.0.id', 'last-unit-product')
            ->assertJsonPath('products.0.inventory.default::default', 0);

        // Nothing left to sell: a second order is rejected, the product is not deleted.
        $this->order('last-unit-product', 1)->assertStatus(422);
        $this->assertDatabaseHas('catalog_products', ['external_id' => 'last-unit-product']);
    }
}
