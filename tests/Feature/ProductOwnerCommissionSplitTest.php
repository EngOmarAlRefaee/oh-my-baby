<?php

namespace Tests\Feature;

use App\Models\CatalogProduct;
use App\Models\CommissionShare;
use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\User;
use App\Services\CommissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductOwnerCommissionSplitTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_product_is_automatically_owned_by_logged_in_admin(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'permissions' => ['products.view', 'products.create', 'products.edit'],
        ]);

        $this->actingAs($admin)
            ->postJson('/api/admin/products', [
                'product' => [
                    'id' => 'admin-owned-1',
                    'name' => 'قطعة اختبار',
                    'nameEn' => 'Test item',
                    'world' => 'fashion',
                    'category' => 'girls',
                    'subcategory' => 'all',
                    'audience' => 'girls',
                    'price' => 12,
                    'image' => '/images/test.jpg',
                    'colors' => [],
                    'sizes' => ['4Y'],
                    'inventory' => ['default::4Y' => 5],
                    'sections' => [],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseHas('catalog_products', [
            'external_id' => 'admin-owned-1',
            'created_by' => $admin->id,
        ]);
    }

    public function test_order_snapshots_product_owners_and_splits_half_dollar_once_per_unique_admin(): void
    {
        config([
            'ohmybaby.exchange.url' => '',
            'ohmybaby.exchange.html_fallback_url' => '',
            'ohmybaby.exchange.fallback_rate' => 10000,
            'ohmybaby.commissions.normal_order_usd' => 0.50,
        ]);

        $adminA = User::factory()->create(['role' => 'admin']);
        $adminB = User::factory()->create(['role' => 'admin']);
        $adminC = User::factory()->create(['role' => 'admin']);
        $adminD = User::factory()->create(['role' => 'admin']);

        $this->catalogProduct('a-1', $adminA->id, 10);
        $this->catalogProduct('a-2', $adminA->id, 11);
        $this->catalogProduct('b-1', $adminB->id, 12);
        $this->catalogProduct('c-1', $adminC->id, 13);
        $this->catalogProduct('d-1', $adminD->id, 14);

        $response = $this->postJson('/api/orders', [
            'customer_name' => 'Test Customer',
            'customer_phone' => '+963999000001',
            'delivery_address' => 'Damascus',
            'payment_currency' => 'usd',
            'fulfillment_method' => 'delivery',
            'delivery_zone' => 'damascus',
            'items' => [
                $this->orderItem('a-1', 10),
                $this->orderItem('a-2', 11), // same Admin: must still count once
                $this->orderItem('b-1', 12),
                $this->orderItem('c-1', 13),
                $this->orderItem('d-1', 14),
            ],
        ])->assertCreated();

        $orderId = $response->json('order.id');
        $order = Order::with('items')->findOrFail($orderId);

        $this->assertSame(
            [$adminA->id, $adminA->id, $adminB->id, $adminC->id, $adminD->id],
            $order->items->pluck('source_admin_user_id')->map(fn ($id) => (int) $id)->all(),
        );

        $order->forceFill([
            'status' => 'delivered',
            'delivered_at' => now(),
            'customer_confirmed_at' => now(),
        ])->save();

        $commission = app(CommissionService::class)->ensureForDeliveredOrder($order->fresh());
        $shares = CommissionShare::where('commission_transfer_id', $commission->id)
            ->orderBy('admin_user_id')
            ->get();

        $this->assertCount(4, $shares);
        $this->assertSame(0.50, round((float) $shares->sum('amount_usd'), 2));
        $this->assertSame([0.125, 0.125, 0.125, 0.125], $shares->pluck('amount_usd')->map(fn ($v) => (float) $v)->all());
        $this->assertNull($commission->debtor_user_id, 'Shared orders must not point to only one debtor.');

        foreach ($shares as $share) {
            $this->assertDatabaseHas('financial_ledger_entries', [
                'account_user_id' => $share->admin_user_id,
                'order_id' => $order->id,
                'commission_transfer_id' => $commission->id,
                'commission_share_id' => $share->id,
                'type' => 'commission',
                'amount_usd' => -1 * (float) $share->amount_usd,
            ]);
        }

        $this->assertSame(
            -0.50,
            round((float) FinancialLedgerEntry::where('order_id', $order->id)->where('type', 'commission')->sum('amount_usd'), 2),
        );

        // Idempotency: running the service again must not duplicate debt.
        app(CommissionService::class)->ensureForDeliveredOrder($order->fresh());
        $this->assertSame(4, CommissionShare::where('commission_transfer_id', $commission->id)->count());
        $this->assertSame(4, FinancialLedgerEntry::where('order_id', $order->id)->where('type', 'commission')->count());
    }

    private function catalogProduct(string $externalId, int $adminId, float $price): CatalogProduct
    {
        return CatalogProduct::create([
            'external_id' => $externalId,
            'world' => 'fashion',
            'category' => 'girls',
            'subcategory' => 'all',
            'audience' => 'girls',
            'name_ar' => 'قطعة '.$externalId,
            'name_en' => 'Item '.$externalId,
            'price_usd' => $price,
            'image' => '/images/test.jpg',
            'colors' => [],
            'sizes' => ['4Y'],
            'inventory' => ['default::4Y' => 5],
            'sections' => [],
            'status' => 'active',
            'created_by' => $adminId,
            'updated_by' => $adminId,
        ]);
    }

    private function orderItem(string $productId, float $price): array
    {
        return [
            'product_id' => $productId,
            'name_ar' => 'قطعة '.$productId,
            'quantity' => 1,
            'unit_price_usd' => $price,
            'size' => '4Y',
            'category' => 'girls',
            'sections' => [],
        ];
    }
}
