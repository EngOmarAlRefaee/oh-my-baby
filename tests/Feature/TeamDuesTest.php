<?php

namespace Tests\Feature;

use App\Models\FinancialLedgerEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Written but NOT executed (no composer in the build sandbox). No real Sham Cash call is made.
class TeamDuesTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_primary_admin_sees_team_dues_and_external_claim_creates_pending(): void
    {
        $primary = User::factory()->create(['role' => 'admin', 'permissions' => ['commissions.self.view', 'commissions.team.view', 'commissions.team.transfer']]);
        $other = User::factory()->create(['role' => 'admin']);
        FinancialLedgerEntry::create(['account_user_id' => $other->id, 'type' => 'commission', 'amount_usd' => -1,
            'description' => 't', 'idempotency_key' => 'td-1']);

        $this->actingAs($other)->getJson('/api/admin/my-commissions/team-dues')->assertForbidden();
        $this->actingAs($primary)->getJson('/api/admin/my-commissions/team-dues')
            ->assertOk()->assertJsonPath('total_due_usd', 1)->assertJsonPath('sham_ready', false);

        $this->actingAs($primary)->postJson('/api/admin/my-commissions/team-dues/external')->assertOk()->assertJsonPath('count', 1);
        $this->assertDatabaseHas('commission_settlement_requests', ['account_user_id' => $other->id, 'status' => 'pending']);
    }

    public function test_sham_transfer_refused_when_not_linked(): void
    {
        $primary = User::factory()->create(['role' => 'admin', 'permissions' => ['commissions.self.view', 'commissions.team.view', 'commissions.team.transfer']]);
        $this->actingAs($primary)->postJson('/api/admin/my-commissions/team-dues/transfer', ['confirm' => true])->assertStatus(409);
    }
}
