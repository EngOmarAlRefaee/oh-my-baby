<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\Order;
use App\Models\User;
use App\Services\CommissionService;
use App\Services\FinancialLedgerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutoConfirmReceiptTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_order_is_auto_confirmed_after_12_hours_and_charges_the_product_owner_admin(): void
    {
        [$admin, $order] = $this->deliveredOrder(hoursAgo: 13);

        $this->artisan('omb:auto-confirm-receipts')->assertSuccessful();

        $this->assertNotNull($order->fresh()->customer_confirmed_at);
        $this->assertDatabaseHas('order_events', ['order_id' => $order->id, 'event' => 'receipt_auto_confirmed']);
        $this->assertSame(-0.5, app(FinancialLedgerService::class)->balanceFor($admin));

        // Idempotent: a second run must not charge again.
        $this->artisan('omb:auto-confirm-receipts')->assertSuccessful();
        $this->assertSame(1, FinancialLedgerEntry::where('type', 'commission')->count());
    }

    public function test_order_delivered_less_than_12_hours_ago_is_not_confirmed(): void
    {
        [$admin, $order] = $this->deliveredOrder(hoursAgo: 11);

        $this->artisan('omb:auto-confirm-receipts')->assertSuccessful();

        $this->assertNull($order->fresh()->customer_confirmed_at);
        $this->assertSame(0.0, app(FinancialLedgerService::class)->balanceFor($admin));
    }

    public function test_order_with_return_in_progress_is_not_auto_confirmed(): void
    {
        [$admin, $order] = $this->deliveredOrder(hoursAgo: 20, status: 'return_requested');

        $this->artisan('omb:auto-confirm-receipts')->assertSuccessful();

        $this->assertNull($order->fresh()->customer_confirmed_at);
        $this->assertSame(0.0, app(FinancialLedgerService::class)->balanceFor($admin));
    }

    public function test_offer_order_is_auto_confirmed_but_has_no_commission(): void
    {
        [$admin, $order] = $this->deliveredOrder(hoursAgo: 14, isOffer: true);

        $this->artisan('omb:auto-confirm-receipts')->assertSuccessful();

        $this->assertNotNull($order->fresh()->customer_confirmed_at);
        $this->assertSame('excluded', $order->fresh()->commission->status);
        $this->assertSame(0, FinancialLedgerEntry::where('type', 'commission')->count());
        $this->assertSame(0.0, app(FinancialLedgerService::class)->balanceFor($admin));
    }

    public function test_return_after_auto_confirmation_reverses_the_commission(): void
    {
        [$admin, $order] = $this->deliveredOrder(hoursAgo: 13);
        $this->artisan('omb:auto-confirm-receipts')->assertSuccessful();
        $this->assertSame(-0.5, app(FinancialLedgerService::class)->balanceFor($admin));

        app(CommissionService::class)->reverseForReturnedOrder($order->fresh(), 'Order returned to store');

        $this->assertSame(0.0, app(FinancialLedgerService::class)->balanceFor($admin));
        $this->assertDatabaseHas('financial_ledger_entries', ['type' => 'commission']);
        $this->assertDatabaseHas('financial_ledger_entries', ['type' => 'commission_reversal']);
    }

    /** @return array{0: User, 1: Order} guest order (no user account) */
    private function deliveredOrder(int $hoursAgo, string $status = 'delivered', bool $isOffer = false): array
    {
        $admin = User::factory()->create(['role' => 'admin', 'account_status' => 'active', 'is_primary_admin' => true]);

        $order = Order::create([
            'reference' => 'TEST-'.uniqid(),
            'user_id' => null, // guest
            'status' => $status,
            'customer_name' => 'Guest',
            'customer_phone' => '0999000000',
            'delivery_address' => 'Test address',
            'subtotal_usd' => 10,
            'discount_usd' => 0,
            'total_usd' => 10,
            'delivered_at' => now()->subHours($hoursAgo),
        ]);
        $order->items()->create([
            'product_external_id' => 'P-1',
            'source_admin_user_id' => $admin->id,
            'name_en' => 'Test product',
            'quantity' => 1,
            'unit_price_usd' => 10,
            'line_total_usd' => 10,
            'category' => 'clothes',
            'sections' => $isOffer ? ['offers'] : [],
            'is_offer' => $isOffer,
        ]);

        return [$admin, $order];
    }
}
