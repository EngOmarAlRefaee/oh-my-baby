<?php

namespace App\Support;

use App\Models\User;

class PermissionCatalog
{
    public static function groupsForRole(string $role): array
    {
        if ($role === 'delivery') {
            return [
                [
                    'key' => 'delivery',
                    'title_ar' => 'صلاحيات الديليفري',
                    'title_en' => 'Delivery permissions',
                    'items' => [
                        ['code' => 'delivery.orders.view', 'ar' => 'مشاهدة الطلبات المسندة إليه', 'en' => 'View assigned deliveries'],
                        ['code' => 'delivery.start', 'ar' => 'بدء التوصيل', 'en' => 'Start delivery'],
                        ['code' => 'delivery.complete', 'ar' => 'تأكيد التسليم', 'en' => 'Confirm delivery'],
                        ['code' => 'delivery.return_at_door', 'ar' => 'تسجيل مرتجع عند الباب', 'en' => 'Mark return at the door'],
                        ['code' => 'delivery.return_pickup', 'ar' => 'استلام مرتجع من الزبون', 'en' => 'Pick up customer return'],
                        ['code' => 'delivery.return_complete', 'ar' => 'تأكيد وصول المرتجع للمتجر', 'en' => 'Complete return to store'],
                        ['code' => 'delivery.customer_phone', 'ar' => 'مشاهدة رقم الزبون والاتصال به', 'en' => 'View and call customer phone'],
                    ],
                ],
            ];
        }

        if ($role !== 'admin') {
            return [];
        }

        return [
            [
                'key' => 'team',
                'title_ar' => 'الحسابات والفريق',
                'title_en' => 'Accounts & team',
                'items' => [
                    ['code' => 'team.view', 'ar' => 'مشاهدة الحسابات والفريق', 'en' => 'View accounts and team'],
                    ['code' => 'team.create_admin', 'ar' => 'إنشاء حساب Admin جديد', 'en' => 'Create admin accounts'],
                    ['code' => 'team.create_delivery', 'ar' => 'إنشاء حساب Delivery جديد', 'en' => 'Create delivery accounts'],
                    ['code' => 'team.create_customer', 'ar' => 'إنشاء حساب زبون جديد', 'en' => 'Create customer accounts'],
                    ['code' => 'team.edit_accounts', 'ar' => 'تعديل بيانات الحسابات', 'en' => 'Edit account details'],
                    ['code' => 'team.manage_permissions', 'ar' => 'تعديل صلاحيات الحسابات الأدنى منه', 'en' => 'Manage permissions below own level'],
                    ['code' => 'team.suspend_accounts', 'ar' => 'إيقاف وإعادة تفعيل الحسابات', 'en' => 'Suspend and reactivate accounts'],
                ],
            ],
            [
                'key' => 'products',
                'title_ar' => 'المنتجات والمخزون',
                'title_en' => 'Products & inventory',
                'items' => [
                    ['code' => 'products.view', 'ar' => 'مشاهدة المنتجات والمخزون', 'en' => 'View products and inventory'],
                    ['code' => 'products.create', 'ar' => 'إضافة منتجات جديدة', 'en' => 'Create products'],
                    ['code' => 'products.edit', 'ar' => 'تعديل المنتجات والصور والأسعار والقياسات والألوان والمخزون', 'en' => 'Edit products, images, prices, sizes, colors and inventory'],
                    ['code' => 'products.archive', 'ar' => 'إخفاء أو أرشفة المنتجات', 'en' => 'Hide or archive products'],
                ],
            ],
            [
                'key' => 'orders',
                'title_ar' => 'الطلبات والعمليات',
                'title_en' => 'Orders & operations',
                'items' => [
                    ['code' => 'orders.view', 'ar' => 'مشاهدة كل الطلبات', 'en' => 'View orders'],
                    ['code' => 'orders.accept', 'ar' => 'قبول الطلبات', 'en' => 'Accept orders'],
                    ['code' => 'orders.reject', 'ar' => 'رفض الطلبات', 'en' => 'Reject orders'],
                    ['code' => 'orders.dispatch', 'ar' => 'تعيين السائق وإرسال الطلب إليه', 'en' => 'Assign and dispatch drivers'],
                    ['code' => 'orders.returns', 'ar' => 'إدارة المرتجعات وطلبات الإرجاع', 'en' => 'Manage returns'],
                ],
            ],
            [
                'key' => 'delivery',
                'title_ar' => 'التوصيل والعمل مكان السائق',
                'title_en' => 'Delivery operations',
                'items' => [
                    ['code' => 'delivery.view', 'ar' => 'مشاهدة لوحة التوصيل', 'en' => 'View delivery workspace'],
                    ['code' => 'delivery.act_as', 'ar' => 'تنفيذ إجراءات السائق من حساب الإدمن', 'en' => 'Perform delivery actions as admin'],
                ],
            ],
            [
                'key' => 'finance',
                'title_ar' => 'Sham Cash والعمولات التشغيلية',
                'title_en' => 'Sham Cash & operational finance',
                'items' => [
                    ['code' => 'finance.view', 'ar' => 'مشاهدة التحصيل والعمولات', 'en' => 'View collections and commissions'],
                    ['code' => 'finance.transfer', 'ar' => 'تنفيذ تحويل العمولة عند توفر الربط', 'en' => 'Execute configured commission transfers'],
                ],
            ],
            [
                'key' => 'owner_requests',
                'title_ar' => 'التعامل مع الأونر',
                'title_en' => 'Owner requests',
                'items' => [
                    ['code' => 'owner_requests.manage', 'ar' => 'رفع الطلبات والملاحظات للأونر ومتابعتها', 'en' => 'Create and track owner requests'],
                ],
            ],
            [
                'key' => 'analytics',
                'title_ar' => 'الإحصائيات والمراقبة',
                'title_en' => 'Analytics & monitoring',
                'items' => [
                    ['code' => 'analytics.view', 'ar' => 'مشاهدة الإحصائيات والزيارات وتسجيلات الدخول', 'en' => 'View analytics, visits and logins'],
                ],
            ],
        ];
    }

    public static function flatForRole(string $role): array
    {
        $codes = [];
        foreach (self::groupsForRole($role) as $group) {
            foreach ($group['items'] as $item) {
                $codes[] = $item['code'];
            }
        }
        return array_values(array_unique($codes));
    }

    public static function dependencies(): array
    {
        return [
            'team.create_admin' => ['team.view'],
            'team.create_delivery' => ['team.view'],
            'team.create_customer' => ['team.view'],
            'team.edit_accounts' => ['team.view'],
            'team.manage_permissions' => ['team.view'],
            'team.suspend_accounts' => ['team.view'],
            'products.create' => ['products.view'],
            'products.edit' => ['products.view'],
            'products.archive' => ['products.view'],
            'orders.accept' => ['orders.view'],
            'orders.reject' => ['orders.view'],
            'orders.dispatch' => ['orders.view'],
            'orders.returns' => ['orders.view'],
            'delivery.act_as' => ['delivery.view'],
            'finance.transfer' => ['finance.view'],
            'delivery.start' => ['delivery.orders.view'],
            'delivery.complete' => ['delivery.orders.view'],
            'delivery.return_at_door' => ['delivery.orders.view'],
            'delivery.return_pickup' => ['delivery.orders.view'],
            'delivery.return_complete' => ['delivery.orders.view'],
            'delivery.customer_phone' => ['delivery.orders.view'],
        ];
    }

    public static function effectiveFor(User $user): array
    {
        if ($user->role === 'owner') {
            return ['*'];
        }

        if ($user->role === 'admin' && (bool) $user->is_primary_admin) {
            return self::flatForRole('admin');
        }

        $allowed = self::flatForRole($user->role);
        $assigned = is_array($user->permissions) ? $user->permissions : [];

        return array_values(array_intersect($assigned, $allowed));
    }

    public static function has(User $user, string $permission): bool
    {
        if ($user->role === 'owner') {
            return true;
        }

        if ($user->role === 'admin' && (bool) $user->is_primary_admin) {
            return in_array($permission, self::flatForRole('admin'), true);
        }

        return in_array($permission, self::effectiveFor($user), true);
    }

    public static function assignableBy(User $actor, string $targetRole): array
    {
        $targetAllowed = self::flatForRole($targetRole);
        if ($actor->role === 'owner' || ($actor->role === 'admin' && (bool) $actor->is_primary_admin)) {
            return $targetAllowed;
        }

        if ($actor->role !== 'admin') {
            return [];
        }

        $actorEffective = self::effectiveFor($actor);
        return array_values(array_intersect($targetAllowed, $actorEffective));
    }

    public static function sanitizeForAssignment(User $actor, string $targetRole, array $requested): array
    {
        $assignable = self::assignableBy($actor, $targetRole);
        $selected = array_values(array_intersect(array_values(array_unique($requested)), $assignable));
        $dependencies = self::dependencies();

        $changed = true;
        while ($changed) {
            $changed = false;
            foreach ($selected as $permission) {
                foreach ($dependencies[$permission] ?? [] as $dependency) {
                    if (in_array($dependency, $assignable, true) && ! in_array($dependency, $selected, true)) {
                        $selected[] = $dependency;
                        $changed = true;
                    }
                }
            }
        }

        return array_values(array_unique($selected));
    }
}
