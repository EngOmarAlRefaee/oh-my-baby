<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleDashboardStorefrontAccessTest extends TestCase
{
    use RefreshDatabase;

    private function user(string $role, array $permissions = [], bool $storefrontAccess = true): User
    {
        $user = User::factory()->create(['role' => $role]);
        $user->forceFill([
            'account_status' => 'active',
            'permissions' => $permissions,
            'storefront_access' => $storefrontAccess,
        ])->save();

        return $user->fresh();
    }

    public function test_every_role_has_its_own_dashboard_route(): void
    {
        $owner = $this->user('owner');
        $admin = $this->user('admin', ['products.view'], false);
        $delivery = $this->user('delivery', ['delivery.orders.view'], false);
        $customer = $this->user('customer');

        $this->actingAs($owner)->get('/owner')->assertOk();
        $this->actingAs($admin)->get('/admin')->assertOk();
        $this->actingAs($delivery)->get('/delivery')->assertOk();
        $this->actingAs($customer)->get('/customer')->assertOk();
    }

    public function test_owner_can_choose_dashboard_only_or_storefront_for_staff(): void
    {
        $owner = $this->user('owner');

        $response = $this->actingAs($owner)->postJson('/api/team', [
            'name' => 'Store Admin',
            'email' => 'store-admin@example.test',
            'phone' => '0999000111',
            'role' => 'admin',
            'password' => 'password123',
            'permissions' => ['products.view'],
            'data_scopes' => [],
            'storefront_access' => true,
        ])->assertCreated();

        $this->assertTrue((bool) $response->json('user.storefront_access'));
        $admin = User::where('email', 'store-admin@example.test')->firstOrFail();
        $this->actingAs($admin)->get('/')->assertOk();

        $admin->forceFill(['storefront_access' => false])->save();
        $this->actingAs($admin->fresh())->get('/')->assertRedirect('/admin');
    }

    public function test_delegated_admin_cannot_grant_storefront_access(): void
    {
        $actor = $this->user('admin', ['team.view', 'team.create_admin', 'products.view'], false);

        $this->actingAs($actor)->postJson('/api/team', [
            'name' => 'Child Admin',
            'email' => 'child-admin@example.test',
            'phone' => '0999000222',
            'role' => 'admin',
            'password' => 'password123',
            'permissions' => ['products.view'],
            'data_scopes' => [],
            'storefront_access' => true,
        ])->assertCreated();

        $child = User::where('email', 'child-admin@example.test')->firstOrFail();
        $this->assertFalse((bool) $child->storefront_access);
        $this->actingAs($child)->get('/')->assertRedirect('/admin');
    }
}
