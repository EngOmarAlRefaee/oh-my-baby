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
                    ['code' => 'products.manage_all', 'ar' => 'تعديل وحذف منتجات الأدمنات الآخرين (بدونها يدير منتجاته فقط)', 'en' => "Edit and delete other admins' products (otherwise own products only)"],
                    ['code' => 'products.stock_alerts', 'ar' => 'مشاهدة تنبيه المنتجات التي نفدت من المخزون لكل الأدمنات', 'en' => 'See out-of-stock alerts for all admins'],
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
                'key' => 'personal_commissions',
                'title_ar' => 'عمولاتي ومستحقاتي',
                'title_en' => 'My commissions & dues',
                'items' => [
                    ['code' => 'commissions.self.view', 'ar' => 'مشاهدة ملخص عمولاته ومستحقاته الشخصية', 'en' => 'View own commission and dues summary'],
                    ['code' => 'commissions.self.orders', 'ar' => 'مشاهدة تفاصيل الطلبات وحصته من عمولة كل طلب', 'en' => 'View own order commission details and share per order'],
                    ['code' => 'commissions.self.claim', 'ar' => 'تأكيد أنه تم تحويل المستحق الأسبوعي', 'en' => 'Confirm weekly due transfer was sent'],
                    ['code' => 'commissions.self.stats', 'ar' => 'مشاهدة إحصائياته الشخصية (القطع المدخلة والمباعة وعمولة الأسبوع)', 'en' => 'View own stats (pieces entered/sold, weekly commission)'],
                    ['code' => 'commissions.team.view', 'ar' => 'مشاهدة مستحقات فريق الأدمن مجتمعة (للأدمن الرئيسي)', 'en' => 'View combined team dues (primary admin)'],
                    ['code' => 'commissions.lock_exempt', 'ar' => 'إعفاؤه من قفل الحساب عند عدم تسديد العمولة الأسبوعية', 'en' => 'Exempt from the weekly unpaid-commission lock'],
                    ['code' => 'commissions.team.transfer', 'ar' => 'تحويل مستحقات الفريق للأونر (شام كاش أو تأكيد تحويل خارجي)', 'en' => 'Transfer team dues to the owner (Sham Cash or external claim)'],
                ],
            ],
            [
                'key' => 'marketing',
                'title_ar' => 'التسويق والعروض',
                'title_en' => 'Marketing & offers',
                'items' => [
                    ['code' => 'marketing.view', 'ar' => 'مشاهدة التسويق والعروض والاستفتاءات', 'en' => 'View marketing, offers and polls'],
                    ['code' => 'marketing.manage', 'ar' => 'تعديل العروض والكوبونات وإعدادات التسويق', 'en' => 'Manage offers, coupons and marketing settings'],
                    ['code' => 'marketing.contacts.view', 'ar' => 'مشاهدة قائمة إيميلات وأرقام الزبائن', 'en' => 'View customer email and phone lists'],
                    ['code' => 'marketing.email.send', 'ar' => 'إرسال رسالة جماعية عبر البريد الإلكتروني', 'en' => 'Send bulk email campaigns'],
                    ['code' => 'marketing.sms.send', 'ar' => 'إنشاء حملة SMS جماعية وإرسالها عبر هاتف البوابة', 'en' => 'Create bulk SMS campaigns through the phone gateway'],
                    ['code' => 'marketing.sms.gateway.manage', 'ar' => 'ربط وإدارة هاتف بوابة SMS', 'en' => 'Pair and manage the SMS gateway phone'],
                ],
            ],
            [
                'key' => 'site_content',
                'title_ar' => 'محتوى الموقع (الموسم والترند)',
                'title_en' => 'Site content (season & trends)',
                'items' => [
                    ['code' => 'site_content.edit', 'ar' => 'تعديل قسم الموسم/الترند بالصفحة الرئيسية (العناوين والنصوص والصورة والروابط)', 'en' => 'Edit the homepage seasonal/trend section (titles, text, image, links)'],
                ],
            ],
            [
                'key' => 'decoration',
                'title_ar' => 'التزيين',
                'title_en' => 'Decoration',
                'items' => [
                    ['code' => 'decoration.view', 'ar' => 'مشاهدة مساحة عمل التزيين', 'en' => 'View decoration workspace'],
                ],
            ],
            [
                'key' => 'support',
                'title_ar' => 'خدمة العملاء والمحادثات',
                'title_en' => 'Customer support & chat',
                'items' => [
                    ['code' => 'support.view', 'ar' => 'مشاهدة محادثات العملاء', 'en' => 'View customer conversations'],
                    ['code' => 'support.notifications', 'ar' => 'استلام إشعارات محادثات الدعم', 'en' => 'Receive support conversation notifications'],
                    ['code' => 'support.reply', 'ar' => 'الرد على محادثات العملاء', 'en' => 'Reply to customer conversations'],
                    ['code' => 'support.assign', 'ar' => 'تعيين المحادثات لموظف دعم', 'en' => 'Assign conversations to support staff'],
                    ['code' => 'support.close', 'ar' => 'إغلاق وإعادة فتح المحادثات', 'en' => 'Close and reopen conversations'],
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
            'products.manage_all' => ['products.view'],
            'products.stock_alerts' => ['products.view'],
            'orders.accept' => ['orders.view'],
            'orders.reject' => ['orders.view'],
            'orders.dispatch' => ['orders.view'],
            'orders.returns' => ['orders.view'],
            'delivery.act_as' => ['delivery.view'],
            'commissions.self.orders' => ['commissions.self.view'],
            'commissions.self.claim' => ['commissions.self.view'],
            'commissions.self.stats' => ['commissions.self.view'],
            'commissions.team.view' => ['commissions.self.view'],
            'commissions.team.transfer' => ['commissions.self.view', 'commissions.team.view'],
            'marketing.manage' => ['marketing.view'],
            'marketing.contacts.view' => ['marketing.view'],
            'marketing.email.send' => ['marketing.view', 'marketing.contacts.view'],
            'marketing.sms.send' => ['marketing.view', 'marketing.contacts.view'],
            'marketing.sms.gateway.manage' => ['marketing.view'],
            'support.notifications' => ['support.view'],
            'support.reply' => ['support.view'],
            'support.assign' => ['support.view'],
            'support.close' => ['support.view'],
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

        $allowed = self::flatForRole($user->role);
        $assigned = is_array($user->permissions) ? $user->permissions : [];

        return array_values(array_intersect($assigned, $allowed));
    }

    public static function has(User $user, string $permission): bool
    {
        if ($user->role === 'owner') {
            return true;
        }

        return in_array($permission, self::effectiveFor($user), true);
    }

    public static function assignableBy(User $actor, string $targetRole): array
    {
        $targetAllowed = self::flatForRole($targetRole);
        if ($actor->role === 'owner') {
            return $targetAllowed;
        }

        if ($actor->role !== 'admin') {
            return [];
        }

        $actorEffective = self::effectiveFor($actor);
        return array_values(array_intersect($targetAllowed, $actorEffective));
    }

    public static function targetPermissionsWithinActor(User $actor, User $target): bool
    {
        if ($actor->role === 'owner') return true;
        if ($actor->role !== 'admin') return false;

        return count(array_diff(self::effectiveFor($target), self::effectiveFor($actor))) === 0;
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
