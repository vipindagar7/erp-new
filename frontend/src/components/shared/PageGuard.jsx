// src/components/shared/PageGuard.jsx
// ─────────────────────────────────────
// Drop-in replacement aligned to permission.config.js dot-notation keys.
// Replaces previous version — same import path, same API, no breaking changes.
//
// Usage:
//   <PageGuard permission="students.create">
//     <Button>Add Student</Button>
//   </PageGuard>
//
//   <PageGuard anyOf={["students.create","students.update"]}>
//     <EditPanel />
//   </PageGuard>
//
//   <PageGuard role="SUPER_ADMIN">
//     <DeleteButton />
//   </PageGuard>
//
//   <PageGuard superAdminOnly>
//     <DeleteButton />
//   </PageGuard>
// ─────────────────────────────────────
import { useSelector } from "react-redux";
import { hasPermission, hasAnyPermission } from "../../config/permission.config.js";
import { getUserRoles } from "./RoleGuard.jsx";

export default function PageGuard({ permission, anyOf, role, superAdminOnly, children, fallback = null }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return fallback;

  // SUPER_ADMIN always passes
  if (user.role === "SUPER_ADMIN") return children;

  // superAdminOnly gate — non-SUPER_ADMINs always blocked
  if (superAdminOnly) return fallback;

  // Role check
  if (role) {
    const userRoles = getUserRoles(user);
    if (!userRoles.includes(role)) return fallback;
  }

  // Single permission
  if (permission && !hasPermission(user, permission)) return fallback;

  // Any-of permissions
  if (anyOf && !hasAnyPermission(user, ...anyOf)) return fallback;

  return children;
}

// ── usePageGuard hook — for imperative checks ─────────────────
export function usePageGuard() {
  const { user } = useSelector((s) => s.auth);
  return {
    can: (permission) => hasPermission(user, permission),
    canAny: (...keys) => hasAnyPermission(user, ...keys),
    is: (role) => getUserRoles(user).includes(role),
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isRoot: !!user?.is_root,
    user,
  };
}