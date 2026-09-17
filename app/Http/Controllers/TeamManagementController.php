<?php

namespace App\Http\Controllers;

use App\Models\StaffActionLog;
use App\Models\User;
use App\Support\PermissionCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
                'id', 'name', 'email', 'phone', 'role', 'is_primary_admin', 'permissions', 'permissions_updated_at',
                'account_status', 'last_login_at', 'suspended_at', 'suspension_reason', 'created_by', 'created_at',
            ]);

        $logs = $actor->role === 'owner'
            ? StaffActionLog::query()
                ->with(['actor:id,name,email,role', 'target:id,name,email,role'])
                ->latest()
                ->limit(40)
                ->get()
            : collect();

        return response()->json([
            'viewer_id' => $actor->id,
            'viewer_role' => $actor->role,
            'viewer_is_primary_admin' => (bool) $actor->is_primary_admin,
            'viewer_effective_permissions' => PermissionCatalog::effectiveFor($actor),
            'creatable_roles' => $this->creatableRoles($actor),
            'permission_dependencies' => PermissionCatalog::dependencies(),
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
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:40'],
            'role' => ['required', Rule::in($creatableRoles)],
            'password' => ['required', Password::min(8)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:100'],
        ]);

        $permissions = $this->validatedAssignment($actor, $data['role'], $data['permissions'] ?? []);
        if (in_array($data['role'], ['admin', 'delivery'], true) && count($permissions) === 0) {
            throw ValidationException::withMessages([
                'permissions' => ['Choose at least one permission for Admin or Delivery accounts.'],
            ]);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role' => $data['role'],
            'password' => $data['password'],
            'permissions' => $data['role'] === 'customer' ? [] : $permissions,
            'permissions_updated_at' => now(),
            'permissions_updated_by' => $actor->id,
            'is_primary_admin' => false,
            'account_status' => 'active',
            'created_by' => $actor->id,
        ]);

        $this->log($actor, $user, 'staff_created', 'Created '.$user->role.' account.', [
            'permissions' => $user->permissions ?? [],
        ]);

        return response()->json([
            'message' => 'Account created.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_primary_admin', 'permissions', 'account_status']),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $this->assertCanEdit($actor, $user);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['required', 'string', 'max:40'],
            'password' => ['nullable', Password::min(8)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:100'],
        ]);

        $updates = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
        ];

        if (!empty($data['password'])) {
            $updates['password'] = $data['password'];
        }

        if (in_array($user->role, ['admin', 'delivery'], true)) {
            abort_unless($this->can($actor, 'team.manage_permissions'), 403, 'You cannot edit permissions.');
            abort_if($actor->id === $user->id, 403, 'You cannot edit your own permissions here.');
            $assignable = PermissionCatalog::assignableBy($actor, $user->role);
            $requested = $this->validatedAssignment($actor, $user->role, $data['permissions'] ?? []);
            if (! $user->is_primary_admin && count($requested) === 0) {
                throw ValidationException::withMessages([
                    'permissions' => ['Admin and Delivery accounts must keep at least one permission.'],
                ]);
            }
            $existing = is_array($user->permissions) ? $user->permissions : [];
            $lockedExisting = array_values(array_diff($existing, $assignable));
            $updates['permissions'] = array_values(array_unique([...$lockedExisting, ...$requested]));
            $updates['permissions_updated_at'] = now();
            $updates['permissions_updated_by'] = $actor->id;
        }

        $user->forceFill($updates)->save();

        $this->log($actor, $user, 'account_updated', 'Updated account details and permissions.', [
            'permissions' => $user->permissions ?? [],
        ]);

        return response()->json([
            'message' => 'Account updated.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'is_primary_admin', 'permissions', 'account_status']),
        ]);
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($this->can($actor, 'team.suspend_accounts'), 403);
        $this->assertCanManageTarget($actor, $user);
        abort_if($actor->id === $user->id, 422, 'You cannot suspend your own account.');
        abort_if($user->role === 'owner', 403, 'Owner accounts cannot be suspended here.');

        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $user->forceFill([
            'account_status' => 'suspended',
            'suspended_at' => now(),
            'suspended_by' => $actor->id,
            'suspension_reason' => $data['reason'],
        ])->save();

        $this->log($actor, $user, 'account_suspended', $data['reason']);
        return response()->json(['message' => 'Account suspended.']);
    }

    public function reactivate(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($this->can($actor, 'team.suspend_accounts'), 403);
        $this->assertCanManageTarget($actor, $user);
        abort_if($user->role === 'owner', 403, 'Owner accounts cannot be managed here.');

        $user->forceFill([
            'account_status' => 'active',
            'suspended_at' => null,
            'suspended_by' => null,
            'suspension_reason' => null,
        ])->save();

        $this->log($actor, $user, 'account_reactivated', 'Account reactivated.');
        return response()->json(['message' => 'Account reactivated.']);
    }

    public function makePrimaryAdmin(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->role === 'owner', 403);
        abort_unless($user->role === 'admin', 422, 'Only an Admin can become primary Admin.');

        User::where('role', 'admin')->update(['is_primary_admin' => false]);
        $user->forceFill(['is_primary_admin' => true])->save();
        $this->log($actor, $user, 'primary_admin_assigned', 'Assigned as primary Admin.');

        return response()->json(['message' => 'Primary Admin updated.']);
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
        $canDelegate = $this->can($actor, 'team.manage_permissions');
        if ($canDelegate && $this->can($actor, 'team.create_admin')) $roles[] = 'admin';
        if ($canDelegate && $this->can($actor, 'team.create_delivery')) $roles[] = 'delivery';
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

        if ($actor->role !== 'owner' && ! $this->can($actor, 'team.manage_permissions')) {
            throw ValidationException::withMessages([
                'permissions' => ['You do not have permission to delegate account permissions.'],
            ]);
        }

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
            'meta' => ['target_role' => $target->role, ...$meta],
        ]);
    }
}
