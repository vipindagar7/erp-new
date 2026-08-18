// src/components/shared/PermGuard.jsx
// Route-level permission guard
// Usage: <PermGuard perm="students.view"><StudentsPage/></PermGuard>
// Usage: <PermGuard anyOf={["students.view","students.create"]}><Page/></PermGuard>
// Usage: <PermGuard rootOnly><RootOnlyPage/></PermGuard>

import { useSelector } from "react-redux";
import { Navigate }    from "react-router-dom";

const hasPermission = (user, key) => {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const perms = user.effectivePermissions || user.permissions || [];
  return perms.includes(key);
};

const isRoot = (user) =>
  user?.is_root === true || user?.role === "SUPER_ADMIN";

export function PermGuard({ perm, anyOf = [], rootOnly = false, superAdminOnly = false, children }) {
  const { user } = useSelector(s => s.auth);

  if (!user) return <Navigate to="/login" replace />;

  // Root only check
  if (rootOnly && !isRoot(user))
    return <Navigate to="/unauthorized" replace />;

  // Super admin only check
  if (superAdminOnly && user.role !== "SUPER_ADMIN")
    return <Navigate to="/unauthorized" replace />;

  // Permission check
  if (perm && !hasPermission(user, perm))
    return <Navigate to="/unauthorized" replace />;

  if (anyOf.length > 0 && !anyOf.some(p => hasPermission(user, p)))
    return <Navigate to="/unauthorized" replace />;

  return children;
}

// Inline — hides element (doesn't redirect)
export function CanDo({ perm, anyOf = [], rootOnly = false, children, fallback = null }) {
  const { user } = useSelector(s => s.auth);
  if (!user) return fallback;
  if (rootOnly && !isRoot(user)) return fallback;
  if (perm && !hasPermission(user, perm)) return fallback;
  if (anyOf.length > 0 && !anyOf.some(p => hasPermission(user, p))) return fallback;
  return children;
}

export default PermGuard;
