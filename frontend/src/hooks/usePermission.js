// src/hooks/usePermission.js
// Reads user.permissions[] (dot-notation keys) from Redux authSlice.
// SUPER_ADMIN bypasses all checks.
import { useSelector } from "react-redux";
import { hasPermission, hasAnyPermission } from "../config/permission.config.js";

export function usePermission() {
    const { user } = useSelector((s) => s.auth);

    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const has = (key) => hasPermission(user, key);
    const hasAny = (...keys) => hasAnyPermission(user, ...keys);
    const hasAll = (...keys) => keys.every((k) => hasPermission(user, k));

    return { has, hasAny, hasAll, isSuperAdmin, user };
}