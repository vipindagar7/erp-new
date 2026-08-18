// src/components/shared/RoleGuard.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

// ── All roles a user can access (primary + extra) ─────────────
export const getUserRoles = (user) => {
  if (!user) return [];
  return [user.role, ...(user.extra_roles || [])].filter(Boolean);
};

// ── Role → home route ──────────────────────────────────────────
// Simple rule: STUDENT → /student, everyone else → /admin
// Works for any dynamically created role — no hardcoded list needed
export const getRoleHome = (role) => {
  if (role === "STUDENT") return "/student";
  if (!role) return "/login";
  return "/admin";
};

// ── All roles that share the /admin layout ─────────────────────
// Kept for backward compatibility — router.jsx imports this
// Since all non-student roles go to /admin, this is effectively "all non-student roles"
export const ADMIN_LAYOUT_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "HOD",
  "CLASS_COORDINATOR",
  "TRAINING_AND_PLACEMENT_OFFICER",
  "LIBRARIAN",
  "ACCOUNTANT",
  "FACULTY",
  "NON_TEACHING",
  "IT_ADMIN",
  "EXAM_COORDINATOR",
  "CURRICULUM_ADMIN",
];

// ── Effective home for a user (handles primary + extra roles) ──
export const getEffectiveHome = (user) => {
  if (!user) return "/login";
  const roles = getUserRoles(user);
  if (roles.includes("STUDENT")) {
    // Only go to /student if STUDENT is their ONLY role
    const hasAdminRole = roles.some((r) => r !== "STUDENT");
    if (!hasAdminRole) return "/student";
  }
  return "/admin";
};

// ── All dashboards a user can access ──────────────────────────
export const getUserDashboards = (user) => {
  if (!user) return [];
  return getUserRoles(user)
    .filter((r, i, a) => a.indexOf(r) === i)
    .map((role) => ({ role, path: getRoleHome(role) }));
};

// ── Init spinner ───────────────────────────────────────────────
export function InitSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700
          flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
          <span className="text-white font-extrabold text-lg">E</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PublicRoute — blocks logged-in users from /login ──────────
export function PublicRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <InitSpinner />;
  if (user) return <Navigate to={getEffectiveHome(user)} replace />;
  return children;
}

// ── ProtectedRoute — any authenticated user ───────────────────
export function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ── RoleGuard — restricts to specific roles ───────────────────
// If roles=[] → allow any authenticated user
export function RoleGuard({ roles = [], children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles.length > 0) {
    const userRoles = getUserRoles(user);
    const allowed = roles.some((r) => userRoles.includes(r));
    if (!allowed) return <Navigate to={getEffectiveHome(user)} replace />;
  }

  return children;
}

export default RoleGuard;