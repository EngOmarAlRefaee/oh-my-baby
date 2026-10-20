<?php

namespace Tests\Feature;

use App\Models\CatalogProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// Written but NOT executed (no composer in the build sandbox).
class ProductOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function product(int $ownerId, array $inventory = ['default::default' => 0]): CatalogProduct
    {
        return CatalogProduct::create([
            'external_id' => 'p'.$ownerId, 'world' => 'fashion', 'category' => 'girls', 'name_ar' => 'منتج',
            'price_usd' => 10, 'image' => '/x.jpg', 'inventory' => $inventory, 'status' => 'active', 'created_by' => $ownerId,
        ]);
    }

    public function test_admin_cannot_archive_other_admins_product_without_manage_all(): void
    {
        $a = User::factory()->create(['role' => 'admin', 'permissions' => ['products.view', 'products.archive']]);
        $b = User::factory()->create(['role' => 'admin', 'permissions' => ['products.view', 'products.archive']]);
        $this->product($b->id);

        $this->actingAs($a)->deleteJson('/api/admin/products/p'.$b->id)->assertForbidden();
        $this->actingAs($b)->deleteJson('/api/admin/products/p'.$b->id)->assertOk();
    }

    public function test_manage_all_permission_allows_it_and_alerts_list_out_of_stock(): void
    {
        $a = User::factory()->create(['role' => 'admin', 'permissions' => ['products.view', 'products.archive', 'products.manage_all', 'products.stock_alerts']]);
        $b = User::factory()->create(['role' => 'admin', 'permissions' => ['products.view']]);
        $this->product($b->id);

        $this->actingAs($a)->getJson('/api/admin/stock-alerts')->assertOk()->assertJsonPath('count', 1);
        $this->actingAs($a)->deleteJson('/api/admin/products/p'.$b->id)->assertOk();
    }
}
