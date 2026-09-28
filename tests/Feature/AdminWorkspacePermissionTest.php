<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminWorkspacePermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_session_exposes_only_effective_permissions_for_admin(): void
    {
        $admin = $this->makeAdmin(['orders.view', 'products.view']);

        $response = $this->actingAs($admin)->getJson('/auth/session');

        $response->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.is_primary_admin', false)
            ->assertJsonPath('user.account_status', 'active')
            ->assertJsonCount(2, 'user.effective_permissions');

        $this->assertEqualsCanonicalizing(
            ['orders.view', 'products.view'],
            $response->json('user.effective_permissions')
        );
    }

    public function test_primary_admin_does_not_receive_unassigned_permissions_implicitly(): void
    {
        $admin = $this->makeAdmin(['orders.view']);
        $admin->forceFill(['is_primary_admin' => true])->save();
        $admin->refresh();

        $this->actingAs($admin)->get('/admin/orders')->assertOk();
        $this->actingAs($admin)->get('/admin/products')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/operations')->assertRedirect('/admin');

        $session = $this->actingAs($admin)->getJson('/auth/session')->assertOk();
        $this->assertEqualsCanonicalizing(['orders.view'], $session->json('user.effective_permissions'));
    }

    public function test_admin_dashboard_is_available_without_analytics_permission(): void
    {
        $admin = $this->makeAdmin(['orders.view']);

        $this->actingAs($admin)->get('/admin')->assertOk();
        $this->actingAs($admin)->getJson('/api/dashboard')->assertForbidden();
    }

    public function test_admin_workspace_routes_are_enforced_server_side_without_showing_error_page(): void
    {
        $admin = $this->makeAdmin(['orders.view']);

        $this->actingAs($admin)->get('/admin/orders')->assertOk();
        $this->actingAs($admin)->get('/admin/products')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/team')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/operations')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/delivery')->assertRedirect('/admin');

        // API security stays strict even though browser pages redirect quietly.
        $this->actingAs($admin)->getJson('/api/admin/products')->assertForbidden();
    }

    public function test_granted_workspace_becomes_available_without_changing_role(): void
    {
        $admin = $this->makeAdmin(['orders.view', 'delivery.view']);

        $this->actingAs($admin)->get('/admin/orders')->assertOk();
        $this->actingAs($admin)->get('/delivery')->assertOk();
    }

    private function makeAdmin(array $permissions): User
    {
        $user = User::factory()->create();
        $user->forceFill([
            'name' => 'Permission Test Admin',
            'email' => 'permission-admin-'.uniqid().'@example.com',
            'phone' => '+9639'.random_int(10000000, 99999999),
            'role' => 'admin',
            'password' => 'Password123!',
            'account_status' => 'active',
            'is_primary_admin' => false,
            'permissions' => $permissions,
        ])->save();

        return $user->fresh();
    }
}
