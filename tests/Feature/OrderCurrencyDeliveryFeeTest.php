<?php

namespace Tests\Feature;

use App\Services\ExchangeRateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Concerns\CreatesCheckoutProducts;

class OrderCurrencyDeliveryFeeTest extends TestCase
{
    use RefreshDatabase;
    use CreatesCheckoutProducts;

    public function test_server_adds_two_point_five_usd_for_damascus_delivery(): void
    {
        $this->createCheckoutProduct('currency-product', 10);

        $this->mock(ExchangeRateService::class, function ($mock): void {
            $mock->shouldReceive('current')->once()->andReturn([
                'usd_to_syp' => 13700,
                'source' => 'test',
            ]);
            $mock->shouldReceive('convertUsdToSyp')
                ->once()
                ->with(22.5, \Mockery::type('array'))
                ->andReturn(308250);
        });

        $response = $this->postJson('/api/orders', [
            'customer_phone' => '0999000044',
            'delivery_address' => 'Damascus test address',
            'payment_currency' => 'syp',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
            'items' => [[
                'product_id' => 'currency-product',
                'quantity' => 2,
                'unit_price_usd' => 10,
                'sections' => [],
            ]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('order.payment_currency', 'syp')
            ->assertJsonPath('order.fulfillment_method', 'delivery')
            ->assertJsonPath('order.delivery_zone', 'damascus')
            ->assertJsonPath('order.total_syp', '308250.00');

        $this->assertDatabaseHas('orders', [
            'customer_phone' => '0999000044',
            'payment_currency' => 'syp',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
            'delivery_fee_usd' => 2.50,
            'subtotal_usd' => 20.00,
            'total_usd' => 22.50,
        ]);
    }

    public function test_server_adds_four_usd_for_remote_delivery(): void
    {
        $this->createCheckoutProduct('remote-product', 10);

        $this->mock(ExchangeRateService::class, function ($mock): void {
            $mock->shouldReceive('current')->once()->andReturn([
                'usd_to_syp' => 10000,
                'source' => 'test',
            ]);
            $mock->shouldReceive('convertUsdToSyp')
                ->once()
                ->with(14.0, \Mockery::type('array'))
                ->andReturn(140000);
        });

        $this->postJson('/api/orders', [
            'customer_phone' => '0999000066',
            'delivery_address' => 'Remote test address',
            'payment_currency' => 'usd',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'remote',
            'items' => [[
                'product_id' => 'remote-product',
                'quantity' => 1,
                'unit_price_usd' => 10,
                'sections' => [],
            ]],
        ])->assertCreated();

        $this->assertDatabaseHas('orders', [
            'customer_phone' => '0999000066',
            'delivery_zone' => 'remote',
            'delivery_fee_usd' => 4.00,
            'total_usd' => 14.00,
        ]);
    }

    public function test_payment_currency_is_required_and_limited_to_usd_or_syp(): void
    {
        $this->postJson('/api/orders', [
            'customer_phone' => '0999000055',
            'delivery_address' => 'Bad currency address',
            'payment_currency' => 'eur',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
            'items' => [[
                'product_id' => 'currency-product',
                'quantity' => 1,
                'unit_price_usd' => 10,
                'sections' => [],
            ]],
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('payment_currency');
    }
}
