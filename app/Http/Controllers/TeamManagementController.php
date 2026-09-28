<?php

namespace App\Http\Controllers;

use App\Models\StaffActionLog;
use App\Models\User;
use App\Support\DataScope;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class TeamManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $this->assertCanViewTeam($actor);

        $users = User::query()
            ->whereIn('role', ['admin', 'delivery', 'customer'])
            ->orderByRaw("CASE role WHEN 'admin' THEN 1 WHEN 'delivery' THEN 2 ELSE 3 END")
            ->orderByDesc('is_primary_admin')
            ->orderBy('name')
            ->get([
                'id', 'name', 'email', 'phone', 'role', 'is_primary_admin', 'permissions', 'data_scopes', 'permissions_updated_at',
                'account_status', 'last_login_at', 'suspended_at', 'suspension_reason', 'created_by', 'created_at',
            ]);

        if ($actor->role === 'owner') {
            $users->each(function (User $user): void {
                $user->setAttribute('deletion', $this->deletionAssessment($user));
            });
        }

        $logs = $actor->role === 'owner'
            ? StaffActionLog::query()
                ->with(['actor:id,name,email,role', 'target:id,name,email,role'])
                ->latest()
                ->limit(60)
                ->get()
            : collect();

        return response()->json([
            'viewer_id' => $actor->id,
            'viewer_role' => $actor->role,
            'viewer_is_primary_admin' => (bool) $actor->is_primary_admin,
            'viewer_effective_permissions' => PermissionCatalog::effectiveFor($actor),
            'creatable_roles' => $this->creatableRoles($actor),
            'permission_dependencies' => PermissionCatalog::dependencies(),
            'scope_definitions' => [
                'admin' => DataScope::definitionsForRole('admin'),
                'delivery' => DataScope::definitionsForRole('delivery'),
            ],
            'scope_mode_labels' => DataScope::modeLabels(),
            'scope_section_options' => DataScope::sectionOptions(),
            'scope_defaults' => [
                'admin' => DataScope::defaultsForRole('admin'),
                'delivery' => DataScope::defaultsForRole('delivery'),
            ],
            'viewer_data_scopes' => DataScope::effectiveFor($actor),
            'permission_groups' => [
                'admin' => $this->filteredGroupsForActor($actor, 'admin'),
                'delivery' => $this->filteredGroupsForActor($actor, 'delivery'),
            ],
            'users' => $users,
            'summary' => [
                'admins' => User::where('role', 'admin')->count(),
                'active_admins' => User::where('role', 'admin')->where('account_status', 'active')->count(),
                'drivers' => User::where('role', 'delivery')->count(),
                'active_drivers' => User::where('role', 'delivery')->where('account_status', 'active')->count(),
                'customers' => User::where('role', 'customer')->count(),
            ],
            'activity' => $logs,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();
        $creatableRoles = $this->creatableRoles($actor);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['required', 'string', 'max:40'],
            'role' => ['required', Rule::in($creatableRoles)],
            'password' => ['required', Password::min(8)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:100'],
            'data_scopes' => ['nullable', 'array'],
            'data_scopes.*' => ['nullable', 'array'],
            'data_scopes.*.mode' => ['nullable', 'string', Rule::in(['all', 'section', 'assigned', 'related'])],
            'data_scopes.*.values' => ['nullable', 'array'],
            'data_scopes.*.values.*' => ['string', 'max:100'],
        ]);

        $email = $this->normalizeEmail($data['email']);
        $phone = $this->normalizePhone($data['phone']);
        $this->assertIdentityAvailable($email, $phone);

        $permissions = $this->validatedAssignment($actor, $data['role'], $data['permissions'] ?? []);
        $dataScopes = in_array($data['role'], ['admin', 'delivery'], true)
            ? DataScope::validateAssignment($actor, $data['role'], $data['data_scopes'] ?? [], $permissions)
            : [];
        if (in_array($data['role'], ['admin', 'delivery'], true) && count($permissions) === 0) {
            throw ValidationException::withMessages([
                'permissions' => ['Choose at least one permission for Admin or Delivery accounts.'],
            ]);
        }

        $user = DB::transaction(function () use ($actor, $data, $email, $phone, $permissions, $dataScopes): User {
            $user = new User();
            $user->forceFill([
                'name' => trim($data['name']),
                'email' => $email,
                'phone' => $phone,
                'role' => $data['role'],
                'password' => $data['password'],
                'permissions' => $data['role'] === 'customer' ? [] : $permissions,
                'data_scopes' => $data['role'] === 'customer' ? [] : $dataScopes,
                'permissions_updated_at' => now(),
                'permissions_updated_by' => $actor->id,
                'is_primary_admin' => false,
                'account_status' => 'active',
                'created_by' => $actor->id,
            ]);
            $user->save();

            $this->log($actor, $user, 'staff_created', 'Created '.$user->role.' account.', [
                'permissions' => $user->permissions ?? [],
                'data_scopes' => $user->data_scopes ?? [],
            ]);

            return $user;
        });

        return response()->json([
            'message' => 'Account created.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_primary_admin', 'permissions', 'data_scopes', 'account_status']),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->assertCanEdit($actor, $user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180'],
            'phone' => ['required', 'string', 'max:40'],
            'password' => ['nullable', Password::min(8)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:100'],
            'data_scopes' => ['nullable', 'array'],
            'data_scopes.*' => ['nullable', 'array'],
            'data_scopes.*.mode' => ['nullable', 'string', Rule::in(['all', 'section', 'assigned', 'related'])],
            'data_scopes.*.values' => ['nullable', 'array'],
            'data_scopes.*.values.*' => ['string', 'max:100'],
        ]);

        $email = $this->normalizeEmail($data['email']);
        $phone = $this->normalizePhone($data['phone']);
        $this->assertIdentityAvailable($email, $phone, $user->id);

        $before = $user->only(['name', 'email', 'phone', 'role', 'permissions', 'data_scopes', 'account_status', 'is_primary_admin']);

        DB::transaction(function () use ($actor, $user, $data, $email, $phone, $before): void {
            $updates = [
                'name' => trim($data['name']),
                'email' => $email,
                'phone' => $phone,
            ];

            if (! empty($data['password'])) {
                $updates['password'] = $data['password'];
            }

            if (in_array($user->role, ['admin', 'delivery'], true)) {
                // The Owner is always allowed to configure a Primary Admin's permissions.
                // "Primary" is an operational designation, not a hidden super-role.
                abort_unless($actor->role === 'owner' || $this->can($actor, 'team.manage_permissions'), 403, 'You cannot edit permissions.');
                abort_if($actor->id === $user->id, 403, 'You cannot edit your own permissions here.');
                $assignable = PermissionCatalog::assignableBy($actor, $user->role);
                $requested = $this->validatedAssignment($actor, $user->role, $data['permissions'] ?? []);
                if (count($requested) === 0) {
                    throw ValidationException::withMessages([
                        'permissions' => ['Admin and Delivery accounts must keep at least one permission.'],
                    ]);
                }
                $existing = is_array($user->permissions) ? $user->permissions : [];
                $lockedExisting = array_values(array_diff($existing, $assignable));
                $updates['permissions'] = array_values(array_unique([...$lockedExisting, ...$requested]));
                $updates['data_scopes'] = DataScope::validateAssignment($actor, $user->role, $data['data_scopes'] ?? ($user->data_scopes ?? []), $updates['permissions']);
                $updates['permissions_updated_at'] = now();
                $updates['permissions_updated_by'] = $actor->id;
            }

            $user->forceFill($updates)->save();

            if (! empty($data['password'])) {
                $this->invalidateSessions($user->id);
            }

            $this->log($actor, $user, 'account_updated', 'Updated account details and permissions.', [
                'before' => $before,
                'after' => $user->only(['name', 'email', 'phone', 'role', 'permissions', 'data_scopes', 'account_status', 'is_primary_admin']),
                'password_changed' => ! empty($data['password']),
            ]);
        });

        return response()->json([
            'message' => 'Account updated.',
            'user' => $user->fresh()->only(['id', 'name', 'email', 'phone', 'role', 'is_primary_admin', 'permissions', 'data_scopes', 'account_status']),
        ]);
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($this->can($actor, 'team.suspend_accounts'), 403);
        $this->assertCanManageTarget($actor, $user);
        abort_if($actor->id === $user->id, 422, 'You cannot suspend your own account.');
        abort_if($user->role === 'owner', 403, 'Owner accounts cannot be suspended here.');
        abort_if($user->is_primary_admin, 422, 'Assign another primary Admin before suspending this account.');

        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $reason = trim($data['reason']);

        DB::transaction(function () use ($actor, $user, $reason): void {
            $user->forceFill([
                'account_status' => 'suspended',
                'suspended_at' => now(),
                'suspended_by' => $actor->id,
                'suspension_reason' => $reason,
            ])->save();

            $this->invalidateSessions($user->id);
            $this->log($actor, $user, 'account_suspended', $reason);
        });

        return response()->json(['message' => 'Account suspended.']);
    }

    public function reactivate(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($this->can($actor, 'team.suspend_accounts'), 403);
        $this->assertCanManageTarget($actor, $user);
        abort_if($user->role === 'owner', 403, 'Owner accounts cannot be managed here.');

        DB::transaction(function () use ($actor, $user): void {
            $user->forceFill([
                'account_status' => 'active',
                'suspended_at' => null,
                'suspended_by' => null,
                'suspension_reason' => null,
            ])->save();

            $this->log($actor, $user, 'account_reactivated', 'Account reactivated.');
        });

        return response()->json(['message' => 'Account reactivated.']);
    }

    public function makePrimaryAdmin(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->role === 'owner', 403);
        abort_unless($user->role === 'admin', 422, 'Only an Admin can become primary Admin.');
        abort_unless(($user->account_status ?? 'active') === 'active', 422, 'Reactivate this Admin before making it primary.');

        DB::transaction(function () use ($actor, $user): void {
            User::query()->where('role', 'admin')->lockForUpdate()->get(['id']);
            User::where('role', 'admin')->update(['is_primary_admin' => false]);
            $user->forceFill(['is_primary_admin' => true])->save();
            $this->log($actor, $user, 'primary_admin_assigned', 'Assigned as primary Admin.');
        });

        return response()->json(['message' => 'Primary Admin updated.']);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->role === 'owner', 403);
        abort_if($actor->id === $user->id, 422, 'You cannot delete your own Owner account.');
        abort_if($user->role === 'owner', 403, 'Owner accounts cannot be deleted here.');
        abort_if((bool) $user->is_primary_admin, 422, 'Assign another primary Admin before deleting this account.');

        $assessment = $this->deletionAssessment($user);
        if (! $assessment['can_delete']) {
            return response()->json([
                'message' => 'This account has linked business data and cannot be permanently deleted. Suspend it instead.',
                'blockers' => $assessment['blockers'],
            ], 422);
        }

        DB::transaction(function () use ($actor, $user): void {
            $snapshot = $this->targetSnapshot($user);
            $this->log($actor, $user, 'account_deleted', 'Permanently deleted an unused account.', [
                'deleted_account' => $snapshot,
            ]);

            $this->invalidateSessions($user->id);
            if (Schema::hasTable('password_reset_tokens')) {
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            }

            // These columns intentionally have no FK constraints in the current schema.
            // Null them before deletion so we never leave dangling account-management references.
            User::where('created_by', $user->id)->update(['created_by' => null]);
            User::where('permissions_updated_by', $user->id)->update(['permissions_updated_by' => null]);
            User::where('suspended_by', $user->id)->update(['suspended_by' => null]);

            $user->delete();
        });

        return response()->json(['message' => 'Unused account deleted permanently.']);
    }

    private function assertCanViewTeam(User $actor): void
    {
        abort_unless($actor->role === 'owner' || $this->can($actor, 'team.view'), 403);
    }

    private function assertCanEdit(User $actor, User $target): void
    {
        abort_unless($this->can($actor, 'team.edit_accounts'), 403);
        $this->assertCanManageTarget($actor, $target);
    }

    private function assertCanManageTarget(User $actor, User $target): void
    {
        abort_if($target->role === 'owner', 403, 'Owner account cannot be managed here.');

        if ($actor->role === 'owner') {
            return;
        }

        abort_unless($actor->role === 'admin', 403);
        abort_if($target->role === 'admin' && (bool) $target->is_primary_admin, 403, 'Primary Admin can only be managed by Owner.');

        if (in_array($target->role, ['admin', 'delivery'], true)) {
            abort_unless(PermissionCatalog::targetPermissionsWithinActor($actor, $target), 403);
            abort_unless(DataScope::canManageTarget($actor, $target), 403);
        }

        if ($target->role === 'admin') {
            abort_unless($this->can($actor, 'team.create_admin') || $this->can($actor, 'team.manage_permissions'), 403);
        }
    }

    private function creatableRoles(User $actor): array
    {
        if ($actor->role === 'owner') {
            return ['admin', 'delivery', 'customer'];
        }

        $roles = [];
        if ($this->can($actor, 'team.create_admin')) $roles[] = 'admin';
        if ($this->can($actor, 'team.create_delivery')) $roles[] = 'delivery';
        if ($this->can($actor, 'team.create_customer')) $roles[] = 'customer';
        return $roles;
    }

    private function filteredGroupsForActor(User $actor, string $role): array
    {
        $assignable = PermissionCatalog::assignableBy($actor, $role);
        $groups = PermissionCatalog::groupsForRole($role);

        return array_values(array_filter(array_map(function (array $group) use ($assignable) {
            $group['items'] = array_values(array_filter(
                $group['items'],
                fn (array $item) => in_array($item['code'], $assignable, true)
            ));
            return $group;
        }, $groups), fn (array $group) => count($group['items']) > 0));
    }

    private function validatedAssignment(User $actor, string $targetRole, array $requested): array
    {
        if ($targetRole === 'customer') {
            return [];
        }

        // Creating a new account is itself an explicit delegation grant.
        // An Admin who is allowed to create a target role may choose only from
        // permissions already present in their own effective permission set.
        // team.manage_permissions remains required for editing an existing
        // staff account's permissions, but is not required for initial creation.
        $assignable = PermissionCatalog::assignableBy($actor, $targetRole);
        $unknownOrForbidden = array_values(array_diff(array_unique($requested), $assignable));
        if ($unknownOrForbidden) {
            throw ValidationException::withMessages([
                'permissions' => ['You cannot grant one or more selected permissions.'],
            ]);
        }

        return PermissionCatalog::sanitizeForAssignment($actor, $targetRole, $requested);
    }

    private function can(User $actor, string $permission): bool
    {
        return PermissionCatalog::has($actor, $permission);
    }

    private function log(User $actor, User $target, string $action, ?string $note = null, array $meta = []): void
    {
        StaffActionLog::create([
            'actor_user_id' => $actor->id,
            'target_user_id' => $target->id,
            'action' => $action,
            'note' => $note,
            'meta' => [
                'target_role' => $target->role,
                'target_snapshot' => $this->targetSnapshot($target),
                ...$meta,
            ],
        ]);
    }

    private function targetSnapshot(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'permissions' => $user->permissions ?? [],
            'data_scopes' => $user->data_scopes ?? [],
        ];
    }

    private function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    private function normalizePhone(string $phone): string
    {
        return str_replace([' ', '-', '(', ')'], '', trim($phone));
    }

    private function assertIdentityAvailable(string $email, string $phone, ?int $ignoreUserId = null): void
    {
        $emailExists = User::query()
            ->when($ignoreUserId, fn ($q) => $q->where('id', '!=', $ignoreUserId))
            ->whereRaw('LOWER(email) = ?', [$email])
            ->exists();

        if ($emailExists) {
            throw ValidationException::withMessages(['email' => ['This email is already in use.']]);
        }

        $phoneExists = User::query()
            ->when($ignoreUserId, fn ($q) => $q->where('id', '!=', $ignoreUserId))
            ->where('phone', $phone)
            ->exists();

        if ($phoneExists) {
            throw ValidationException::withMessages(['phone' => ['This phone number is already in use.']]);
        }
    }

    private function invalidateSessions(int $userId): void
    {
        if (Schema::hasTable('sessions') && Schema::hasColumn('sessions', 'user_id')) {
            DB::table('sessions')->where('user_id', $userId)->delete();
        }
    }

    private function deletionAssessment(User $user): array
    {
        if ($user->role === 'owner') {
            return ['can_delete' => false, 'blockers' => ['owner_account']];
        }

        if ((bool) $user->is_primary_admin) {
            return ['can_delete' => false, 'blockers' => ['primary_admin']];
        }

        $checks = [
            ['orders', 'user_id', 'customer_orders'],
            ['orders', 'assigned_delivery_id', 'assigned_deliveries'],
            ['orders', 'return_delivery_id', 'return_deliveries'],
            ['order_events', 'actor_user_id', 'order_history'],
            ['reward_coupons', 'user_id', 'reward_coupons'],
            ['owner_requests', 'admin_id', 'owner_requests'],
            ['owner_requests', 'reviewed_by', 'reviewed_owner_requests'],
            ['catalog_products', 'created_by', 'created_products'],
            ['catalog_products', 'updated_by', 'updated_products'],
            ['wishlist_items', 'user_id', 'wishlist'],
            ['product_reviews', 'user_id', 'product_reviews'],
            ['interest_poll_votes', 'user_id', 'poll_votes'],
            ['customer_feedback', 'user_id', 'customer_feedback'],
        ];

        $blockers = [];
        foreach ($checks as [$table, $column, $label]) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
                continue;
            }

            if (DB::table($table)->where($column, $user->id)->exists()) {
                $blockers[] = $label;
            }
        }

        return [
            'can_delete' => count($blockers) === 0,
            'blockers' => $blockers,
        ];
    }
}
