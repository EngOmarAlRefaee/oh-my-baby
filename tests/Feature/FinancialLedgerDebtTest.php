<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\User;
use App\Services\CommissionService;
use App\Services\FinancialLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinancialLedgerDebtTest extends TestCase
{
    use RefreshDatabase;

    public function test_normal_commission_becomes_negative_admin_balance_only_after_customer_confirmation(): void
    {
        [$admin, $customer, $order] = $this->makeDeliveredOrder();

        $commission = app(CommissionService::class)->ensureForDeliveredOrder($order);
        $this->assertSame('awaiting_confirmation', $commission->status);
        $this->assertSame(0, FinancialLedgerEntry::count());

        $order->update(['customer_confirmed_at' => now()]);
        $commission = app(CommissionService::class)->ensureForDeliveredOrder($order->fresh());

        $this->assertSame('pending', $commission->status);
        $this->assertSame($admin->id, $commission->debtor_user_id);
        $this->assertSame(-0.5, app(FinancialLedgerService::class)->balanceFor($admin));
        $this->assertSame(0.5, app(FinancialLedgerService::class)->dueFor($admin));

        app(CommissionService::class)->ensureForDeliveredOrder($order->fresh());
        $this->assertSame(1, FinancialLedgerEntry::where('type', 'commission')->count());
    }

    public function test_customer_confirmation_endpoint_accrues_commission(): void
    {
        [$admin, $customer, $order] = $this->makeDeliveredOrder();

        $this->actingAs($customer)
            ->postJson('/api/orders/'.$order->id.'/confirm-receipt')
            ->assertOk();

        $this->assertNotNull($order->fresh()->customer_confirmed_at);
        $this->assertSame(-0.5, app(FinancialLedgerService::class)->balanceFor($admin));
    }

    public function test_owner_can_record_partial_then_full_settlement(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        [$admin, $customer, $orderOne] = $this->makeDeliveredOrder();
        $orderOne->update(['customer_confirmed_at' => now()]);
        app(CommissionService::class)->ensureForDeliveredOrder($orderOne->fresh());

        [, , $orderTwo] = $this->makeDeliveredOrder($admin, $customer);
        $orderTwo->update(['customer_confirmed_at' => now()]);
        app(CommissionService::class)->ensureForDeliveredOrder($orderTwo->fresh());

        $ledger = app(FinancialLedgerService::class);
        $this->assertSame(-1.0, $ledger->balanceFor($admin));

        $first = $ledger->recordSettlement($admin, $owner, 0.50, 'TEST-1');
        $this->assertSame(1, $first->orders_count);
        $this->assertSame(-0.5, $ledger->balanceFor($admin));

        $ledger->recordSettlement($admin, $owner, 0.50, 'TEST-2');
        $this->assertSame(0.0, $ledger->balanceFor($admin));
        $this->assertSame(0.0, $ledger->dueFor($admin));
    }

    public function test_return_creates_positive_reversal_instead_of_deleting_original_charge(): void
    {
        [$admin, , $order] = $this->makeDeliveredOrder();
        $order->update(['customer_confirmed_at' => now()]);

        $service = app(CommissionService::class);
        $service->ensureForDeliveredOrder($order->fresh());
        $this->assertSame(-0.5, app(FinancialLedgerService::class)->balanceFor($admin));

        $service->reverseForReturnedOrder($order->fresh(), 'Test return');

        $this->assertSame(0.0, app(FinancialLedgerService::class)->balanceFor($admin));
        $this->assertDatabaseHas('financial_ledger_entries', ['type' => 'commission']);
        $this->assertDatabaseHas('financial_ledger_entries', ['type' => 'commission_reversal']);
    }

    public function test_decoration_is_deferred_and_does_not_change_normal_admin_balance(): void
    {
        [$admin, , $order] = $this->makeDeliveredOrder();
        $order->items()->update(['category' => 'decor']);
        $order->update(['customer_confirmed_at' => now()]);

        $commission = app(CommissionService::class)->ensureForDeliveredOrder($order->fresh());

        $this->assertSame('deferred', $commission->status);
        $this->assertSame('decoration_deferred', $commission->type);
        $this->assertSame(0.0, app(FinancialLedgerService::class)->balanceFor($admin));
    }

    private function makeDeliveredOrder(?User $admin = null, ?User $customer = null): array
    {
        $admin ??= User::factory()->create([
            'role' => 'admin',
            'account_status' => 'active',
            'is_primary_admin' => true,
        ]);
        $customer ??= User::factory()->create(['role' => 'customer']);

        $order = Order::create([
            'reference' => 'TEST-'.uniqid(),
            'user_id' => $customer->id,
            'status' => 'delivered',
            'customer_name' => 'Test Customer',
            'customer_phone' => '0999000000',
            'delivery_address' => 'Test address',
            'subtotal_usd' => 10,
            'discount_usd' => 0,
            'total_usd' => 10,
            'accepted_at' => now()->subHour(),
            'accepted_by_user_id' => $admin->id,
            'delivered_at' => now(),
        ]);

        $order->items()->create([
            'product_external_id' => 'P-1',
            'name_en' => 'Test product',
            'quantity' => 1,
            'unit_price_usd' => 10,
            'line_total_usd' => 10,
            'category' => 'clothes',
            'sections' => [],
            'is_offer' => false,
        ]);

        return [$admin, $customer, $order];
    }
}
