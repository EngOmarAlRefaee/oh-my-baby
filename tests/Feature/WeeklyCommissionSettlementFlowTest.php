<?php

namespace Tests\Feature;

use App\Models\CommissionSettlementRequest;
use App\Models\CommissionShare;
use App\Models\CommissionTransfer;
use App\Models\FinancialLedgerEntry;
use App\Models\FinancialSettlement;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WeeklyCommissionSettlementFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_claim_owner_reject_then_confirm_clears_only_current_due_and_keeps_history_owner_only(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $adminA = User::factory()->create([
            'role' => 'admin',
            'permissions' => ['commissions.self.view', 'commissions.self.orders', 'commissions.self.claim'],
        ]);
        $adminB = User::factory()->create([
            'role' => 'admin',
            'permissions' => ['commissions.self.view', 'commissions.self.orders', 'commissions.self.claim'],
        ]);

        $this->createDebt($adminA, 'ORDER-A', 0.25);
        $this->createDebt($adminB, 'ORDER-B', 0.25);

        $this->actingAs($adminA)
            ->getJson('/api/admin/my-commissions')
            ->assertOk()
            ->assertJsonPath('amount_due_usd', 0.25)
            ->assertJsonPath('open_orders_count', 1)
            ->assertJsonMissingPath('settlements');

        $claimResponse = $this->actingAs($adminA)
            ->postJson('/api/admin/my-commissions/claim-transfer', [])
            ->assertCreated()
            ->assertJsonPath('claim.status', 'pending');

        $claimId = $claimResponse->json('claim.id');

        $this->actingAs($owner)
            ->getJson('/api/owner/commissions')
            ->assertOk()
            ->assertJsonPath('summary.pending_claims_count', 1)
            ->assertJsonFragment(['id' => $claimId]);

        $this->actingAs($owner)
            ->postJson('/api/owner/finance/transfer-claims/'.$claimId.'/reject', [
                'note' => 'لم يصل التحويل، تأكد من العملية.',
            ])
            ->assertOk();

        $this->actingAs($adminA)
            ->getJson('/api/admin/my-commissions')
            ->assertOk()
            ->assertJsonPath('amount_due_usd', 0.25)
            ->assertJsonPath('active_claim.status', 'rejected')
            ->assertJsonPath('active_claim.owner_note', 'لم يصل التحويل، تأكد من العملية.');

        $secondClaim = $this->actingAs($adminA)
            ->postJson('/api/admin/my-commissions/claim-transfer', [])
            ->assertCreated();

        $secondClaimId = $secondClaim->json('claim.id');

        $this->actingAs($owner)
            ->postJson('/api/owner/finance/transfer-claims/'.$secondClaimId.'/confirm', [])
            ->assertOk();

        $this->actingAs($adminA)
            ->getJson('/api/admin/my-commissions')
            ->assertOk()
            ->assertJsonPath('amount_due_usd', 0)
            ->assertJsonPath('active_claim', null)
            ->assertJsonMissingPath('settlements');

        // Another Admin's debt is untouched.
        $this->actingAs($adminB)
            ->getJson('/api/admin/my-commissions')
            ->assertOk()
            ->assertJsonPath('amount_due_usd', 0.25);

        $ownerPayload = $this->actingAs($owner)
            ->getJson('/api/owner/commissions')
            ->assertOk();

        $adminAPayload = collect($ownerPayload->json('accounts'))->firstWhere('id', $adminA->id);
        $this->assertSame(0.0, (float) $adminAPayload['amount_due_usd']);
        $this->assertSame(0.25, (float) $adminAPayload['total_collected_usd']);

        $this->assertDatabaseHas('commission_settlement_requests', [
            'id' => $secondClaimId,
            'account_user_id' => $adminA->id,
            'status' => 'confirmed',
        ]);
        $this->assertSame(1, FinancialSettlement::where('account_user_id', $adminA->id)->where('status', 'confirmed')->count());
        $this->assertSame(2, CommissionSettlementRequest::where('account_user_id', $adminA->id)->count());
    }

    private function createDebt(User $admin, string $reference, float $amount): void
    {
        $order = Order::create([
            'reference' => $reference,
            'status' => 'delivered',
            'customer_name' => 'Test Customer',
            'customer_phone' => '+963999000001',
            'delivery_address' => 'Damascus',
            'subtotal_usd' => 10,
            'discount_usd' => 0,
            'total_usd' => 10,
            'delivered_at' => now(),
            'customer_confirmed_at' => now(),
        ]);

        $commission = CommissionTransfer::create([
            'order_id' => $order->id,
            'debtor_user_id' => $admin->id,
            'type' => 'normal_order',
            'amount_usd' => $amount,
            'status' => 'pending',
            'provider' => 'internal_ledger',
        ]);

        $share = CommissionShare::create([
            'commission_transfer_id' => $commission->id,
            'order_id' => $order->id,
            'admin_user_id' => $admin->id,
            'amount_usd' => $amount,
            'paid_usd' => 0,
            'status' => 'pending',
        ]);

        FinancialLedgerEntry::create([
            'account_user_id' => $admin->id,
            'order_id' => $order->id,
            'commission_transfer_id' => $commission->id,
            'commission_share_id' => $share->id,
            'type' => 'commission',
            'amount_usd' => -$amount,
            'idempotency_key' => 'test-commission-'.$admin->id.'-'.$order->id,
            'description' => 'Test commission share',
        ]);
    }
}
