// src/components/shared/RootGuard.jsx
// ─────────────────────────────────────────────────────────────
// Wraps a single route element and redirects away unless the
// logged-in user has is_root === true. Use for the Super Admin
// management page — block/unblock/demote of SUPER_ADMIN accounts
// is root-only both server-side (rootOnly middleware) and now
// client-side too, so non-root users never even see the page shell.
// ─────────────────────────────────────────────────────────────
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { InitSpinner, getEffectiveHome } from "./RoleGuard.jsx";

export default function RootGuard({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user.is_root) return <Navigate to={getEffectiveHome(user)} replace />;

  return children;
}
