<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffWorkspaceIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role, array $permissions = []): User
    {
        $user = User::factory()->create(['role' => $role]);
        $user->forceFill([
            'account_status' => 'active',
            'permissions' => $permissions,
        ])->save();

        return $user->fresh();
    }

    public function test_admin_is_redirected_from_public_store_pages_to_admin_workspace(): void
    {
        $admin = $this->staff('admin', ['products.view']);

        $this->actingAs($admin)->get('/')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/category/clothing')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/account')->assertRedirect('/admin');
    }

    public function test_delivery_is_redirected_from_public_store_pages_to_delivery_workspace(): void
    {
        $delivery = $this->staff('delivery', ['delivery.orders.view']);

        $this->actingAs($delivery)->get('/')->assertRedirect('/delivery');
        $this->actingAs($delivery)->get('/category/clothing')->assertRedirect('/delivery');
        $this->actingAs($delivery)->get('/account')->assertRedirect('/delivery');
    }

    public function test_customer_can_still_browse_public_store(): void
    {
        $customer = $this->staff('customer');

        $this->actingAs($customer)->get('/')->assertOk();
        $this->actingAs($customer)->get('/category/clothing')->assertOk();
    }

    public function test_decoration_admin_can_open_only_granted_decoration_workspace(): void
    {
        $admin = $this->staff('admin', ['decoration.view']);

        $this->actingAs($admin)->get('/admin')->assertOk();
        $this->actingAs($admin)->get('/admin/decoration')->assertOk();
        $this->actingAs($admin)->get('/admin/products')->assertRedirect('/admin');
        $this->actingAs($admin)->get('/admin/operations')->assertRedirect('/admin');
    }

    public function test_admin_without_decoration_permission_is_quietly_returned_to_dashboard(): void
    {
        $admin = $this->staff('admin', ['products.view']);

        $this->actingAs($admin)->get('/admin/decoration')->assertRedirect('/admin');
    }
}
