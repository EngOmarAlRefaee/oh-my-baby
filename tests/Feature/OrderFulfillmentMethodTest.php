<?php

namespace Tests\Feature;

use App\Services\ExchangeRateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Concerns\CreatesCheckoutProducts;

class OrderFulfillmentMethodTest extends TestCase
{
    use RefreshDatabase;
    use CreatesCheckoutProducts;

    public function test_shipping_requires_shipping_fields_and_does_not_add_delivery_fee(): void
    {
        $this->postJson('/api/orders', [
            'payment_currency' => 'usd',
            'fulfillment_method' => 'shipping',
            'items' => [[
                'product_id' => 'shipping-product',
                'quantity' => 1,
                'unit_price_usd' => 10,
                'sections' => [],
            ]],
        ])->assertUnprocessable()
          ->assertJsonValidationErrors([
              'shipping_full_name',
              'shipping_governorate',
              'shipping_company',
              'shipping_address',
              'shipping_phone',
          ]);

        $this->createCheckoutProduct('shipping-product', 10);

        $this->mock(ExchangeRateService::class, function ($mock): void {
            $mock->shouldReceive('current')->once()->andReturn([
                'usd_to_syp' => 10000,
                'source' => 'test',
            ]);
            $mock->shouldReceive('convertUsdToSyp')
                ->once()
                ->with(10.0, \Mockery::type('array'))
                ->andReturn(100000);
        });

        $response = $this->postJson('/api/orders', [
            'payment_currency' => 'usd',
            'fulfillment_method' => 'shipping',
            'shipping_full_name' => 'Test Three Name',
            'shipping_governorate' => 'Homs',
            'shipping_company' => 'Test Shipping',
            'shipping_address' => 'Shipping destination address',
            'shipping_phone' => '0999111222',
            'customer_note' => 'Handle carefully',
            'items' => [[
                'product_id' => 'shipping-product',
                'quantity' => 1,
                'unit_price_usd' => 10,
                'sections' => [],
            ]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('order.fulfillment_method', 'shipping')
            ->assertJsonPath('order.delivery_zone', null)
            ->assertJsonPath('order.delivery_fee_usd', '0.00')
            ->assertJsonPath('order.shipping_governorate', 'Homs');

        $this->assertDatabaseHas('orders', [
            'fulfillment_method' => 'shipping',
            'customer_phone' => '0999111222',
            'shipping_full_name' => 'Test Three Name',
            'shipping_governorate' => 'Homs',
            'shipping_company' => 'Test Shipping',
            'shipping_phone' => '0999111222',
            'delivery_fee_usd' => 0.00,
            'total_usd' => 10.00,
        ]);
    }

    public function test_delivery_requires_address_phone_and_zone_but_not_shipping_fields(): void
    {
        $this->postJson('/api/orders', [
            'payment_currency' => 'usd',
            'fulfillment_method' => 'delivery',
            'items' => [[
                'product_id' => 'delivery-product',
                'quantity' => 1,
                'unit_price_usd' => 10,
                'sections' => [],
            ]],
        ])->assertUnprocessable()
          ->assertJsonValidationErrors([
              'customer_phone',
              'delivery_address',
              'delivery_zone',
          ]);
    }
}
