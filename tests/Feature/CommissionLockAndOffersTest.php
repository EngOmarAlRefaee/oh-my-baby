<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Services\CommissionService;
use App\Support\CommissionLock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Written but NOT executed (no composer in the build sandbox).
class CommissionLockAndOffersTest extends TestCase
{
    use RefreshDatabase;

    private function order(array $items): Order
    {
        $order = Order::create([
            'reference' => 'OMB-L'.random_int(1000, 9999), 'status' => 'delivered', 'customer_name' => 'T',
            'customer_phone' => '0900000000', 'delivery_address' => 'x', 'subtotal_usd' => 10, 'total_usd' => 10,
            'delivered_at' => now()->subDay(), 'customer_confirmed_at' => now()->subHours(20),
        ]);
        foreach ($items as [$owner, $offer]) {
            OrderItem::create(['order_id' => $order->id, 'product_external_id' => 'p', 'source_admin_user_id' => $owner,
                'name_ar' => 'م', 'quantity' => 1, 'unit_price_usd' => 5, 'line_total_usd' => 5, 'category' => 'clothes', 'is_offer' => $offer]);
        }
        return $order->fresh();
    }

    public function test_only_offers_no_commission_but_mixed_order_is_charged(): void
    {
        $a = User::factory()->create(['role' => 'admin']);
        $b = User::factory()->create(['role' => 'admin']);
        $svc = app(CommissionService::class);

        $only = $svc->ensureForDeliveredOrder($this->order([[$a->id, true]]));
        $this->assertSame('offer_excluded', $only->type);

        $mixed = $svc->ensureForDeliveredOrder($this->order([[$a->id, true], [$b->id, false]]));
        $this->assertSame('normal_order', $mixed->type);
        $this->assertSame([$b->id], $mixed->shares->pluck('admin_user_id')->all());
    }

    public function test_admin_with_old_unpaid_debt_is_locked(): void
    {
        $a = User::factory()->create(['role' => 'admin']);
        $e = FinancialLedgerEntry::create(['account_user_id' => $a->id, 'type' => 'commission', 'amount_usd' => -0.5,
            'description' => 't', 'idempotency_key' => 'lock-test']);
        $e->forceFill(['created_at' => now()->subDays(10)])->save();

        $this->assertTrue(CommissionLock::isLocked($a));
        $this->actingAs($a)->getJson('/api/admin/orders')->assertStatus(423);
    }
}
