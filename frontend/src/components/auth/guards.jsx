import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { getRoleHome } from "../../redux/auth/authSlice.js";

/** Shown only in protected routes while fetchMe is in-flight on hard refresh */
function InitSpinner() {
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

/**
 * PublicRoute — for /login, /forgot-password, /reset-password.
 *
 * NO InitSpinner here intentionally.
 * Showing a spinner until initialized on the login page means a slow fetchMe
 * (or a failing /me call) shows a blank screen to unauthenticated users.
 * Instead: show the page immediately. If the user IS logged in,
 * they get redirected once fetchMe resolves and Redux updates.
 */
export function PublicRoute({ children }) {
  const { user } = useSelector((s) => s.auth);
  if (user) return <Navigate to={getRoleHome(user.role)} replace />;
  return children;
}

/**
 * RoleGuard — for protected dashboard routes (/admin, /faculty, /student).
 *
 * Shows spinner until fetchMe completes (initialized = true).
 * This prevents a flash where a logged-in user briefly sees /login.
 *
 * Once initialized:
 *  - no user        → redirect to /login (saves attempted location)
 *  - wrong role     → redirect to their correct dashboard
 *  - correct role   → render children
 */
export function RoleGuard({ roles, children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
}

/**
 * ProtectedRoute — any authenticated user (role-agnostic).
 */
export function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!initialized) return <InitSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}