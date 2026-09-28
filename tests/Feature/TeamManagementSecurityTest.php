<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\StaffActionLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamManagementSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_admin_with_normalized_identity_and_permissions(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');

        $response = $this->actingAs($owner)->postJson('/api/team', [
            'name' => 'Real Admin',
            'email' => ' ADMIN@EXAMPLE.COM ',
            'phone' => '+963 900-000-002',
            'role' => 'admin',
            'password' => 'Password123!',
            'permissions' => ['orders.accept'],
        ]);

        $response->assertCreated();

        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $this->assertSame('+963900000002', $admin->phone);
        $this->assertSame('active', $admin->account_status);
        $this->assertContains('orders.view', $admin->permissions);
        $this->assertContains('orders.accept', $admin->permissions);
        $this->assertSame($owner->id, $admin->created_by);
    }

    public function test_owner_can_delete_only_an_unused_non_primary_account(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');
        $admin = $this->makeUser('admin', 'unused@example.com', '+963900000002', [
            'permissions' => ['orders.view'],
            'is_primary_admin' => false,
        ]);

        $this->actingAs($owner)
            ->deleteJson('/api/team/'.$admin->id)
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $admin->id]);
        $this->assertTrue(
            StaffActionLog::where('target_user_id', $admin->id)->where('action', 'account_deleted')->exists()
        );
    }

    public function test_account_linked_to_an_order_cannot_be_deleted(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');
        $delivery = $this->makeUser('delivery', 'driver@example.com', '+963900000003', [
            'permissions' => ['delivery.orders.view'],
        ]);

        Order::create([
            'reference' => 'TEST-ORDER-1',
            'assigned_delivery_id' => $delivery->id,
            'status' => 'accepted',
            'customer_name' => 'Test Customer',
            'customer_phone' => '+963900000099',
            'delivery_address' => 'Test address',
            'subtotal_usd' => 10,
            'discount_usd' => 0,
            'total_usd' => 10,
        ]);

        $response = $this->actingAs($owner)->deleteJson('/api/team/'.$delivery->id);

        $response->assertStatus(422)->assertJsonFragment(['message' => 'This account has linked business data and cannot be permanently deleted. Suspend it instead.']);
        $this->assertDatabaseHas('users', ['id' => $delivery->id]);
    }


    public function test_owner_can_edit_primary_admin_permissions(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');
        $admin = $this->makeUser('admin', 'primary-edit@example.com', '+963900000002', [
            'is_primary_admin' => true,
            'permissions' => ['orders.view', 'products.view'],
        ]);

        $this->actingAs($owner)
            ->putJson('/api/team/'.$admin->id, [
                'name' => $admin->name,
                'email' => $admin->email,
                'phone' => $admin->phone,
                'permissions' => ['products.view'],
            ])
            ->assertOk();

        $admin->refresh();
        $this->assertTrue((bool) $admin->is_primary_admin);
        $this->assertSame(['products.view'], $admin->permissions);
    }

    public function test_primary_admin_cannot_be_suspended_or_deleted_until_reassigned(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');
        $admin = $this->makeUser('admin', 'primary@example.com', '+963900000002', [
            'is_primary_admin' => true,
            'permissions' => [],
        ]);

        $this->actingAs($owner)
            ->postJson('/api/team/'.$admin->id.'/suspend', ['reason' => 'test'])
            ->assertStatus(422);

        $this->actingAs($owner)
            ->deleteJson('/api/team/'.$admin->id)
            ->assertStatus(422);
    }

    public function test_suspended_account_cannot_log_in(): void
    {
        $user = $this->makeUser('admin', 'blocked@example.com', '+963900000002', [
            'account_status' => 'suspended',
            'password' => 'Password123!',
            'permissions' => ['orders.view'],
        ]);

        $this->postJson('/auth/login', [
            'identifier' => $user->email,
            'password' => 'Password123!',
        ])->assertStatus(403)->assertJsonFragment(['code' => 'account_suspended']);
    }

    private function makeUser(string $role, string $email, string $phone, array $extra = []): User
    {
        $user = User::factory()->create([
            'email' => $email,
        ]);

        $user->forceFill(array_merge([
            'name' => ucfirst($role),
            'email' => $email,
            'phone' => $phone,
            'role' => $role,
            'password' => 'Password123!',
            'account_status' => 'active',
            'is_primary_admin' => false,
            'permissions' => $role === 'owner' ? [] : ['orders.view'],
        ], $extra))->save();

        return $user->fresh();
    }
}
