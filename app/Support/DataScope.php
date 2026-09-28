<?php

namespace App\Support;

use App\Models\CatalogProduct;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class DataScope
{
    public const MODE_ALL = 'all';
    public const MODE_SECTION = 'section';
    public const MODE_ASSIGNED = 'assigned';
    public const MODE_RELATED = 'related';

    public static function definitionsForRole(string $role): array
    {
        if ($role === 'delivery') {
            return [
                'orders' => [
                    'ar' => 'الطلبات', 'en' => 'Orders',
                    'modes' => [self::MODE_ASSIGNED, self::MODE_ALL],
                    'default' => self::MODE_ASSIGNED,
                ],
                'customers' => [
                    'ar' => 'بيانات الزباين', 'en' => 'Customer data',
                    'modes' => [self::MODE_RELATED],
                    'default' => self::MODE_RELATED,
                ],
            ];
        }

        if ($role !== 'admin') {
            return [];
        }

        return [
            'orders' => [
                'ar' => 'الطلبات', 'en' => 'Orders',
                'modes' => [self::MODE_ALL, self::MODE_SECTION],
                'default' => self::MODE_ALL,
            ],
            'products' => [
                'ar' => 'المنتجات والمخزون', 'en' => 'Products & inventory',
                'modes' => [self::MODE_ALL, self::MODE_SECTION],
                'default' => self::MODE_ALL,
            ],
            'customers' => [
                'ar' => 'بيانات الزباين', 'en' => 'Customer data',
                'modes' => [self::MODE_ALL, self::MODE_RELATED],
                'default' => self::MODE_ALL,
            ],
            'delivery' => [
                'ar' => 'بيانات التوصيل', 'en' => 'Delivery data',
                'modes' => [self::MODE_ALL, self::MODE_ASSIGNED],
                'default' => self::MODE_ALL,
            ],
        ];
    }

    public static function modeLabels(): array
    {
        return [
            self::MODE_ALL => ['ar' => 'كل البيانات', 'en' => 'All data'],
            self::MODE_SECTION => ['ar' => 'قسم محدد', 'en' => 'Specific section'],
            self::MODE_ASSIGNED => ['ar' => 'المسند للحساب فقط', 'en' => 'Assigned to this account only'],
            self::MODE_RELATED => ['ar' => 'البيانات المرتبطة بما يشوفه فقط', 'en' => 'Only data related to visible records'],
        ];
    }

    public static function sectionOptions(): array
    {
        $labels = [
            'newborn' => ['ar' => 'حديثي الولادة', 'en' => 'Newborn'],
            'girls' => ['ar' => 'بنات', 'en' => 'Girls'],
            'boys' => ['ar' => 'أولاد', 'en' => 'Boys'],
            'shoes' => ['ar' => 'أحذية', 'en' => 'Shoes'],
            'accessories' => ['ar' => 'إكسسوارات', 'en' => 'Accessories'],
            'decor' => ['ar' => 'استقبال المولود والتزيين', 'en' => 'Newborn Welcome & Decor'],
            'mobility' => ['ar' => 'عربايات ومقاعد', 'en' => 'Strollers & Seats'],
            'gifts' => ['ar' => 'هدايا', 'en' => 'Gifts'],
            'baby-essentials' => ['ar' => 'ألعاب ومستلزمات الطفل', 'en' => 'Toys & Essentials'],
        ];

        try {
            $existing = CatalogProduct::query()
                ->whereNotNull('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->filter()
                ->values();

            foreach ($existing as $code) {
                if (! isset($labels[$code])) {
                    $labels[$code] = ['ar' => $code, 'en' => $code];
                }
            }
        } catch (\Throwable) {
            // Migrations may not have created catalog_products yet in a fresh install.
        }

        return collect($labels)->map(fn (array $label, string $code) => [
            'code' => $code,
            'ar' => $label['ar'],
            'en' => $label['en'],
        ])->values()->all();
    }

    public static function defaultsForRole(string $role): array
    {
        $result = [];
        foreach (self::definitionsForRole($role) as $domain => $definition) {
            $result[$domain] = [
                'mode' => $definition['default'],
                'values' => [],
            ];
        }
        return $result;
    }

    public static function effectiveFor(User $user): array
    {
        if ($user->role === 'owner') {
            return [
                'orders' => ['mode' => self::MODE_ALL, 'values' => []],
                'products' => ['mode' => self::MODE_ALL, 'values' => []],
                'customers' => ['mode' => self::MODE_ALL, 'values' => []],
                'delivery' => ['mode' => self::MODE_ALL, 'values' => []],
            ];
        }

        return self::normalizeForRole($user->role, is_array($user->data_scopes) ? $user->data_scopes : []);
    }

    public static function normalizeForRole(string $role, array $raw): array
    {
        $definitions = self::definitionsForRole($role);
        $defaults = self::defaultsForRole($role);
        $normalized = [];

        foreach ($definitions as $domain => $definition) {
            $candidate = is_array($raw[$domain] ?? null) ? $raw[$domain] : [];
            $mode = (string) ($candidate['mode'] ?? $defaults[$domain]['mode']);
            if (! in_array($mode, $definition['modes'], true)) {
                $mode = $defaults[$domain]['mode'];
            }

            $values = array_values(array_unique(array_filter(
                is_array($candidate['values'] ?? null) ? $candidate['values'] : [],
                fn ($value) => is_string($value) && trim($value) !== ''
            )));

            if ($mode !== self::MODE_SECTION) {
                $values = [];
            }

            $normalized[$domain] = ['mode' => $mode, 'values' => $values];
        }

        return $normalized;
    }

    public static function validateAssignment(User $actor, string $targetRole, array $requested, array $targetPermissions = []): array
    {
        $target = self::normalizeForRole($targetRole, $requested);
        if ($actor->role === 'owner') {
            self::validateSectionSelections($target);
            return $target;
        }

        if ($actor->role !== 'admin') {
            throw ValidationException::withMessages([
                'data_scopes' => ['This account cannot delegate data access.'],
            ]);
        }

        $actorScopes = self::effectiveFor($actor);
        $relevantDomains = self::relevantDomainsForPermissions($targetRole, $targetPermissions);
        if (count($relevantDomains) === 0) {
            self::validateSectionSelections($target);
            return $target;
        }
        foreach ($target as $domain => $scope) {
            if ($relevantDomains && ! in_array($domain, $relevantDomains, true)) continue;
            $actorScope = $actorScopes[$domain] ?? null;
            if (! $actorScope || ! self::scopeWithin($scope, $actorScope)) {
                throw ValidationException::withMessages([
                    "data_scopes.$domain" => ['The selected data scope is broader than the creator account.'],
                ]);
            }
        }

        self::validateSectionSelections($target);
        return $target;
    }

    public static function canManageTarget(User $actor, User $target): bool
    {
        if ($actor->role === 'owner') return true;
        if ($actor->role !== 'admin') return false;

        $actorScopes = self::effectiveFor($actor);
        $targetScopes = self::effectiveFor($target);
        $relevantDomains = self::relevantDomainsForPermissions($target->role, PermissionCatalog::effectiveFor($target));
        if (count($relevantDomains) === 0) return true;

        foreach ($targetScopes as $domain => $scope) {
            if ($relevantDomains && ! in_array($domain, $relevantDomains, true)) continue;
            if (! isset($actorScopes[$domain]) || ! self::scopeWithin($scope, $actorScopes[$domain])) {
                return false;
            }
        }

        return true;
    }

    public static function scopeWithin(array $child, array $parent): bool
    {
        $childMode = $child['mode'] ?? null;
        $parentMode = $parent['mode'] ?? null;

        if ($parentMode === self::MODE_ALL) return true;
        if ($childMode !== $parentMode) return false;

        if ($parentMode === self::MODE_SECTION) {
            $parentValues = $parent['values'] ?? [];
            $childValues = $child['values'] ?? [];
            return count(array_diff($childValues, $parentValues)) === 0;
        }

        return true;
    }

    public static function applyOrders(Builder $query, User $user): Builder
    {
        $scope = self::effectiveFor($user)['orders'] ?? ['mode' => self::MODE_ALL, 'values' => []];

        return match ($scope['mode']) {
            self::MODE_ALL => $query,
            self::MODE_ASSIGNED => $query->where(function (Builder $q) use ($user) {
                $q->where('assigned_delivery_id', $user->id)
                    ->orWhere('return_delivery_id', $user->id);
            }),
            self::MODE_SECTION => $query->whereHas('items', fn (Builder $q) => $q->whereIn('category', $scope['values'] ?: ['__none__'])),
            self::MODE_RELATED => $query->where('user_id', $user->id),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public static function applyProducts(Builder $query, User $user): Builder
    {
        $scope = self::effectiveFor($user)['products'] ?? ['mode' => self::MODE_ALL, 'values' => []];

        return match ($scope['mode']) {
            self::MODE_ALL => $query,
            self::MODE_SECTION => $query->whereIn('category', $scope['values'] ?: ['__none__']),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public static function applyDeliveryOrders(Builder $query, User $user): Builder
    {
        if ($user->role === 'delivery') {
            return self::applyOrders($query, $user);
        }

        $scope = self::effectiveFor($user)['delivery'] ?? ['mode' => self::MODE_ALL, 'values' => []];
        return match ($scope['mode']) {
            self::MODE_ALL => $query,
            self::MODE_ASSIGNED => $query->where(function (Builder $q) use ($user) {
                $q->where('assigned_delivery_id', $user->id)
                    ->orWhere('return_delivery_id', $user->id);
            }),
            default => $query->whereRaw('1 = 0'),
        };
    }

    public static function assertOrderVisible(User $user, Order $order): void
    {
        $visible = self::applyOrders(Order::query()->whereKey($order->id), $user)->exists();
        abort_unless($visible, 403);
    }

    public static function assertDeliveryOrderVisible(User $user, Order $order): void
    {
        $visible = self::applyDeliveryOrders(Order::query()->whereKey($order->id), $user)->exists();
        abort_unless($visible, 403);
    }

    public static function assertProductCategoryVisible(User $user, string $category): void
    {
        if ($user->role === 'owner') return;

        $scope = self::effectiveFor($user)['products'] ?? null;
        if (! $scope) abort(403);
        if ($scope['mode'] === self::MODE_ALL) return;

        abort_unless(
            $scope['mode'] === self::MODE_SECTION && in_array($category, $scope['values'] ?? [], true),
            403
        );
    }

    public static function relevantDomainsForPermissions(string $role, array $permissions): array
    {
        if ($role === 'delivery') {
            return array_values(array_filter(['orders', 'customers'], fn ($domain) => match ($domain) {
                'orders' => self::hasPrefix($permissions, 'delivery.'),
                'customers' => in_array('delivery.customer_phone', $permissions, true),
                default => false,
            }));
        }

        if ($role !== 'admin') return [];

        $domains = [];
        if (self::hasPrefix($permissions, 'orders.')) $domains[] = 'orders';
        if (self::hasPrefix($permissions, 'products.')) $domains[] = 'products';
        if (self::hasPrefix($permissions, 'delivery.')) $domains[] = 'delivery';
        return $domains;
    }

    private static function hasPrefix(array $permissions, string $prefix): bool
    {
        foreach ($permissions as $permission) {
            if (str_starts_with($permission, $prefix)) return true;
        }
        return false;
    }

    private static function validateSectionSelections(array $scopes): void
    {
        $allowedSections = array_column(self::sectionOptions(), 'code');
        foreach ($scopes as $domain => $scope) {
            if (($scope['mode'] ?? null) !== self::MODE_SECTION) continue;
            if (empty($scope['values'])) {
                throw ValidationException::withMessages([
                    "data_scopes.$domain.values" => ['Choose at least one section for a section-limited scope.'],
                ]);
            }
            if (array_diff($scope['values'], $allowedSections)) {
                throw ValidationException::withMessages([
                    "data_scopes.$domain.values" => ['One or more selected sections are invalid.'],
                ]);
            }
        }
    }
}
