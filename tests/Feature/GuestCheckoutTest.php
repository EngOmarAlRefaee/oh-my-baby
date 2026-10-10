<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ExchangeRateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Concerns\CreatesCheckoutProducts;

class GuestCheckoutTest extends TestCase
{
    use RefreshDatabase;
    use CreatesCheckoutProducts;

    public function test_guest_can_submit_order_without_email_verification(): void
    {
        $this->createCheckoutProduct('guest-test-product', 21);

        $this->mock(ExchangeRateService::class, function ($mock): void {
            $mock->shouldReceive('current')->once()->andReturn([
                'usd_to_syp' => 10000,
                'source' => 'test',
            ]);
            $mock->shouldReceive('convertUsdToSyp')
                ->once()
                ->with(23.5, \Mockery::type('array'))
                ->andReturn(235000);
        });

        $response = $this->postJson('/api/orders', [
            'customer_name' => 'Guest Customer',
            'customer_phone' => '0999000022',
            'delivery_address' => 'Guest test address',
            'customer_note' => null,
            'coupon_code' => null,
            'payment_currency' => 'usd',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
            'items' => [[
                'product_id' => 'guest-test-product',
                'name_ar' => 'منتج اختبار',
                'name_en' => 'Test product',
                'image' => null,
                'color_id' => null,
                'color_name' => null,
                'size' => null,
                'quantity' => 1,
                'unit_price_usd' => 21,
                'category' => 'test',
                'sections' => [],
            ]],
        ]);

        $response->assertCreated()
            ->assertJsonPath('order.user_id', null)
            ->assertJsonPath('order.status', 'pending_review')
            ->assertJsonPath('order.payment_currency', 'usd');

        $this->assertDatabaseHas('orders', [
            'customer_phone' => '0999000022',
            'user_id' => null,
            'delivery_fee_usd' => 2.50,
            'total_usd' => 23.50,
        ]);
    }

    public function test_unverified_customer_can_order_and_order_stays_attached_to_account(): void
    {
        $user = User::factory()->unverified()->create([
            'role' => 'customer',
            'email' => 'unverified-order@example.com',
        ]);

        $this->createCheckoutProduct('account-order-product', 10);

        $this->mock(ExchangeRateService::class, function ($mock): void {
            $mock->shouldReceive('current')->once()->andReturn([
                'usd_to_syp' => 10000,
                'source' => 'test',
            ]);
            $mock->shouldReceive('convertUsdToSyp')
                ->once()
                ->with(12.5, \Mockery::type('array'))
                ->andReturn(125000);
        });

        $this->actingAs($user)
            ->postJson('/api/orders', [
                'customer_name' => 'Unverified Customer',
                'customer_phone' => '0999000033',
                'delivery_address' => 'Account order address',
                'payment_currency' => 'syp',
                'fulfillment_method' => 'delivery',
                'delivery_zone' => 'damascus',
                'items' => [[
                    'product_id' => 'account-order-product',
                    'quantity' => 1,
                    'unit_price_usd' => 10,
                    'sections' => [],
                ]],
            ])
            ->assertCreated()
            ->assertJsonPath('order.user_id', $user->id)
            ->assertJsonPath('order.payment_currency', 'syp');
    }
}
