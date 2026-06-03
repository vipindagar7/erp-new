import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

// ── All roles a user can access (primary + extra) ─────────────
export const getUserRoles = (user) => {
  if (!user) return [];
  return [user.role, ...(user.extra_roles || [])];
};

// ── Role → home route mapping ──────────────────────────────────
export const getRoleHome = (role) => {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":    return "/admin";
    case "FACULTY":  return "/faculty";
    case "STUDENT":  return "/student";
    default:         return "/login";
  }
};

// ── All dashboards a user can access ──────────────────────────
export const getUserDashboards = (user) => {
  if (!user) return [];
  return getUserRoles(user)
    .filter((r, i, a) => a.indexOf(r) === i) // dedupe
    .map((role) => ({ role, path: getRoleHome(role) }));
};

// ── Init spinner ───────────────────────────────────────────────
function InitSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700
          flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
          <span className="text-white font-extrabold text-lg">E</span>
        </div>
        <div className="flex gap-1">
          {[0,1,2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PublicRoute ────────────────────────────────────────────────
export function PublicRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (user) return <Navigate to={getRoleHome(user.role)} replace />;
  return children;
}

// ── RoleGuard — supports extra_roles ──────────────────────────
// roles={["ADMIN","SUPER_ADMIN"]} allows access if ANY of user's roles match
export function RoleGuard({ roles = [], children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (roles.length > 0) {
    const userRoles = getUserRoles(user);
    const allowed   = roles.some((r) => userRoles.includes(r));
    if (!allowed) return <Navigate to={getRoleHome(user.role)} replace />;
  }
  return children;
}

// ── ProtectedRoute — any authenticated user ────────────────────
export function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default RoleGuard;
