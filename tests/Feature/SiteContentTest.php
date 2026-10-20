<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteContentTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $override = []): array
    {
        return ['content' => array_replace_recursive([
            'image' => '/uploads/site/x.jpg',
            'ctaHref' => '/collections/winter',
            'secondaryHref' => '/category/clothing',
            'seasonTag' => 'SEASON 02',
            'watermark' => 'WNT',
            'ar' => [
                'eyebrow' => 'تشكيلة الموسم', 'sectionTitle' => 'موسم الشتاء', 'sectionSubtitle' => 'دفا وأناقة',
                'badge' => 'ترند الشتاء', 'headline' => 'جاهزين للبرد.', 'description' => 'ملابس دافئة.',
                'cta' => 'اكتشف التشكيلة', 'secondary' => 'تسوّق كل الأقسام', 'imageAlt' => 'شتاء',
                'tags' => ['جاكيتات', 'كنزات'],
            ],
            'en' => ['sectionTitle' => 'Winter season', 'headline' => 'Ready for the cold.'],
        ], $override)];
    }

    private function admin(array $permissions): User
    {
        return User::factory()->create([
            'role' => 'admin', 'account_status' => 'active', 'permissions' => $permissions,
        ]);
    }

    public function test_public_endpoint_returns_null_until_something_is_saved(): void
    {
        $this->getJson('/api/site/featured-collection')->assertOk()->assertJsonPath('content', null);
    }

    public function test_admin_without_permission_cannot_edit_or_open_the_page(): void
    {
        $admin = $this->admin(['orders.view']);

        $this->actingAs($admin)->putJson('/api/admin/site/featured-collection', $this->payload())->assertForbidden();
        $this->actingAs($admin)->get('/admin/site-content')->assertRedirect('/admin');
    }

    public function test_admin_with_permission_saves_and_storefront_reads_it(): void
    {
        $admin = $this->admin(['site_content.edit']);

        $this->actingAs($admin)->get('/admin/site-content')->assertOk();
        $this->actingAs($admin)->putJson('/api/admin/site/featured-collection', $this->payload())
            ->assertOk()->assertJsonPath('content.ar.sectionTitle', 'موسم الشتاء');

        auth()->logout();
        $this->getJson('/api/site/featured-collection')
            ->assertOk()
            ->assertJsonPath('content.ar.headline', 'جاهزين للبرد.')
            ->assertJsonPath('content.en.headline', 'Ready for the cold.')
            ->assertJsonPath('content.ar.tags.1', 'كنزات');
    }

    public function test_owner_can_edit_without_explicit_grant(): void
    {
        $owner = User::factory()->create(['role' => 'owner', 'account_status' => 'active']);
        $this->actingAs($owner)->putJson('/api/admin/site/featured-collection', $this->payload())->assertOk();
    }

    public function test_dangerous_links_and_html_are_rejected_or_stripped(): void
    {
        $admin = $this->admin(['site_content.edit']);

        $this->actingAs($admin)->putJson('/api/admin/site/featured-collection', $this->payload(['ctaHref' => 'javascript:alert(1)']))
            ->assertStatus(422);

        $this->actingAs($admin)->putJson('/api/admin/site/featured-collection', $this->payload(['ar' => ['headline' => '<script>x</script>جاهزين']]))
            ->assertOk()->assertJsonPath('content.ar.headline', 'xجاهزين');
    }

    public function test_permission_is_assignable_to_admins_by_the_owner_catalog(): void
    {
        $this->assertContains('site_content.edit', \App\Support\PermissionCatalog::flatForRole('admin'));
    }
}
