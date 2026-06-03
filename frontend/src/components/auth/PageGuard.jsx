// src/components/shared/PageGuard.jsx
// ─────────────────────────────────────
// Conditionally renders children based on user permissions.
// SUPER_ADMIN always passes. Use anywhere to show/hide UI.
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
// ─────────────────────────────────────
import { useSelector } from "react-redux";
import { hasPermission, hasAnyPermission } from "../../config/permissions.config.js";
import { getUserRoles } from "../auth/RoleGuard.jsx";

export default function PageGuard({ permission, anyOf, role, children, fallback = null }) {
  const { user } = useSelector((s) => s.auth);
  if (!user) return fallback;

  // SUPER_ADMIN always allowed
  if (user.role === "SUPER_ADMIN") return children;

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
    can:    (permission) => hasPermission(user, permission),
    canAny: (...keys)    => hasAnyPermission(user, ...keys),
    is:     (role)       => getUserRoles(user).includes(role),
    isSuperAdmin:          user?.role === "SUPER_ADMIN",
    user,
  };
}
