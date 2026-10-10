<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SmsGatewayTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_campaign_pair_phone_confirm_and_report_results(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $customer = User::factory()->create([
            'role' => 'customer',
            'phone' => '0991234567',
            'marketing_opt_in' => true,
        ]);

        $campaign = $this->actingAs($owner)->postJson('/api/admin/marketing/broadcast/sms', [
            'message' => 'مرحبا من OH MY BABY',
        ])->assertCreated()->json();

        $this->assertSame(1, $campaign['recipients']);
        $campaignId = (int) $campaign['campaign_id'];
        $this->assertDatabaseHas('sms_campaign_recipients', [
            'campaign_id' => $campaignId,
            'user_id' => $customer->id,
            'phone' => '+963991234567',
            'status' => 'queued',
        ]);

        $pair = $this->actingAs($owner)->postJson('/api/admin/marketing/sms-gateway/pairing-code')->assertCreated()->json();
        $paired = $this->postJson('/api/sms-gateway/pair', [
            'code' => $pair['code'],
            'device_name' => 'My Android',
        ])->assertCreated()->json();

        $token = $paired['token'];
        $this->withToken($token)->getJson('/api/sms-gateway/pending')
            ->assertOk()->assertJsonPath('campaign.id', $campaignId);

        $this->withToken($token)->postJson("/api/sms-gateway/campaigns/{$campaignId}/confirm")
            ->assertOk()->assertJsonPath('status', 'sending');

        $batch = $this->withToken($token)->getJson("/api/sms-gateway/campaigns/{$campaignId}/next?limit=10")
            ->assertOk()->json();
        $recipientId = (int) $batch['recipients'][0]['id'];

        $this->withToken($token)->postJson("/api/sms-gateway/campaigns/{$campaignId}/recipients/{$recipientId}/result", [
            'status' => 'sent',
        ])->assertOk();

        $this->assertDatabaseHas('sms_campaigns', [
            'id' => $campaignId,
            'status' => 'completed',
            'sent_count' => 1,
            'failed_count' => 0,
        ]);
    }
}
