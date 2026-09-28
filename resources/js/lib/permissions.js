export function effectivePermissions(user) {
  if (!user) return [];
  const permissions = Array.isArray(user.effective_permissions) ? user.effective_permissions : [];
  return permissions;
}

export function hasPermission(user, permission) {
  const permissions = effectivePermissions(user);
  return permissions.includes("*") || permissions.includes(permission);
}

export function hasAnyPermission(user, permissions = []) {
  return permissions.some((permission) => hasPermission(user, permission));
}
