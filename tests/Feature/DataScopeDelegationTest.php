<?php

namespace Tests\Feature;

use App\Models\CatalogProduct;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataScopeDelegationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_section_scoped_admin_and_scope_filters_products_and_orders(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');

        $this->actingAs($owner)->postJson('/api/team', [
            'name' => 'Decoration Admin',
            'email' => 'decor@example.com',
            'phone' => '+963900000002',
            'role' => 'admin',
            'password' => 'Password123!',
            'permissions' => ['products.view', 'orders.view'],
            'data_scopes' => [
                'products' => ['mode' => 'section', 'values' => ['decor']],
                'orders' => ['mode' => 'section', 'values' => ['decor']],
            ],
        ])->assertCreated();

        $admin = User::where('email', 'decor@example.com')->firstOrFail();

        CatalogProduct::create([
            'external_id' => 'DECOR-1', 'name_ar' => 'Decor', 'name_en' => 'Decor',
            'category' => 'decor', 'world' => 'baby', 'price_usd' => 20, 'status' => 'active',
        ]);
        CatalogProduct::create([
            'external_id' => 'BOYS-1', 'name_ar' => 'Boys', 'name_en' => 'Boys',
            'category' => 'boys', 'world' => 'fashion', 'price_usd' => 15, 'status' => 'active',
        ]);

        $decorOrder = $this->makeOrder('ORDER-DECOR', 'decor');
        $boysOrder = $this->makeOrder('ORDER-BOYS', 'boys');

        $products = $this->actingAs($admin)->getJson('/api/admin/products')->assertOk()->json('products');
        $this->assertCount(1, $products);
        $this->assertSame('DECOR-1', (string) $products[0]['id']);

        $orders = $this->actingAs($admin)->getJson('/api/admin/orders')->assertOk()->json('orders');
        $this->assertCount(1, $orders);
        $this->assertSame($decorOrder->id, $orders[0]['id']);
        $this->assertNotSame($boysOrder->id, $orders[0]['id']);
    }

    public function test_admin_cannot_delegate_permission_or_scope_broader_than_own(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');
        $admin = $this->makeUser('admin', 'limited@example.com', '+963900000002', [
            'permissions' => ['team.view', 'team.create_admin', 'team.manage_permissions', 'orders.view'],
            'data_scopes' => [
                'orders' => ['mode' => 'section', 'values' => ['decor']],
                'products' => ['mode' => 'all', 'values' => []],
                'customers' => ['mode' => 'all', 'values' => []],
                'delivery' => ['mode' => 'all', 'values' => []],
            ],
            'created_by' => $owner->id,
        ]);

        $this->actingAs($admin)->postJson('/api/team', [
            'name' => 'Too Powerful',
            'email' => 'too-powerful@example.com',
            'phone' => '+963900000003',
            'role' => 'admin',
            'password' => 'Password123!',
            'permissions' => ['orders.view', 'finance.view'],
            'data_scopes' => [
                'orders' => ['mode' => 'all', 'values' => []],
            ],
        ])->assertStatus(422);

        $this->actingAs($admin)->postJson('/api/team', [
            'name' => 'Too Broad',
            'email' => 'too-broad@example.com',
            'phone' => '+963900000004',
            'role' => 'admin',
            'password' => 'Password123!',
            'permissions' => ['orders.view'],
            'data_scopes' => [
                'orders' => ['mode' => 'all', 'values' => []],
            ],
        ])->assertStatus(422);

        $this->actingAs($admin)->postJson('/api/team', [
            'name' => 'Allowed Child',
            'email' => 'allowed@example.com',
            'phone' => '+963900000005',
            'role' => 'admin',
            'password' => 'Password123!',
            'permissions' => ['orders.view'],
            'data_scopes' => [
                'orders' => ['mode' => 'section', 'values' => ['decor']],
            ],
        ])->assertCreated();
    }


    public function test_admin_with_create_admin_can_create_child_without_manage_permissions(): void
    {
        $owner = $this->makeUser('owner', 'owner@example.com', '+963900000001');
        $admin = $this->makeUser('admin', 'creator@example.com', '+963900000002', [
            'permissions' => ['team.view', 'team.create_admin', 'products.view'],
            'data_scopes' => [
                'products' => ['mode' => 'all', 'values' => []],
                'orders' => ['mode' => 'all', 'values' => []],
                'customers' => ['mode' => 'all', 'values' => []],
                'delivery' => ['mode' => 'all', 'values' => []],
            ],
            'created_by' => $owner->id,
        ]);

        $team = $this->actingAs($admin)->getJson('/api/team')->assertOk();
        $this->assertContains('admin', $team->json('creatable_roles'));

        $this->actingAs($admin)->postJson('/api/team', [
            'name' => 'Child Admin',
            'email' => 'child@example.com',
            'phone' => '+963900000003',
            'role' => 'admin',
            'password' => 'Password123!',
            'permissions' => ['products.view'],
            'data_scopes' => [
                'products' => ['mode' => 'all', 'values' => []],
            ],
        ])->assertCreated();

        $child = User::where('email', 'child@example.com')->firstOrFail();
        $this->assertSame(['products.view'], $child->permissions);
    }

    public function test_delivery_assigned_scope_only_returns_own_orders(): void
    {
        $driver = $this->makeUser('delivery', 'driver@example.com', '+963900000010', [
            'permissions' => ['delivery.orders.view'],
            'data_scopes' => [
                'orders' => ['mode' => 'assigned', 'values' => []],
                'customers' => ['mode' => 'related', 'values' => []],
            ],
        ]);
        $other = $this->makeUser('delivery', 'other@example.com', '+963900000011', [
            'permissions' => ['delivery.orders.view'],
        ]);

        $mine = $this->makeOrder('MINE', 'boys', $driver->id, 'assigned_to_driver');
        $this->makeOrder('OTHER', 'boys', $other->id, 'assigned_to_driver');

        $orders = $this->actingAs($driver)->getJson('/api/delivery/orders')->assertOk()->json('orders');
        $this->assertCount(1, $orders);
        $this->assertSame($mine->id, $orders[0]['id']);
    }

    public function test_section_scoped_admin_cannot_modify_out_of_scope_order(): void
    {
        $admin = $this->makeUser('admin', 'decor@example.com', '+963900000020', [
            'permissions' => ['orders.view', 'orders.accept'],
            'data_scopes' => [
                'orders' => ['mode' => 'section', 'values' => ['decor']],
                'products' => ['mode' => 'all', 'values' => []],
                'customers' => ['mode' => 'all', 'values' => []],
                'delivery' => ['mode' => 'all', 'values' => []],
            ],
        ]);

        $outside = $this->makeOrder('OUTSIDE', 'boys');
        $this->actingAs($admin)
            ->postJson('/api/admin/orders/'.$outside->id.'/accept')
            ->assertForbidden();
    }

    private function makeOrder(string $reference, string $category, ?int $driverId = null, string $status = 'pending_review'): Order
    {
        $order = Order::create([
            'reference' => $reference,
            'assigned_delivery_id' => $driverId,
            'status' => $status,
            'customer_name' => 'Customer',
            'customer_phone' => '+963955000000',
            'delivery_address' => 'Address',
            'subtotal_usd' => 10,
            'discount_usd' => 0,
            'total_usd' => 10,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_external_id' => $reference.'-P',
            'name_ar' => 'Item',
            'quantity' => 1,
            'unit_price_usd' => 10,
            'line_total_usd' => 10,
            'category' => $category,
            'sections' => [],
            'is_offer' => false,
        ]);

        return $order;
    }

    private function makeUser(string $role, string $email, string $phone, array $extra = []): User
    {
        $user = User::factory()->create(['email' => $email]);
        $user->forceFill(array_merge([
            'name' => ucfirst($role),
            'email' => $email,
            'phone' => $phone,
            'role' => $role,
            'password' => 'Password123!',
            'account_status' => 'active',
            'is_primary_admin' => false,
            'permissions' => $role === 'owner' ? [] : ['orders.view'],
            'data_scopes' => null,
        ], $extra))->save();
        return $user->fresh();
    }
}
