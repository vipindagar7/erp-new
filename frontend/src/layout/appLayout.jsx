// frontend/src/layout/AppLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { SidebarProvider } from "../hooks/sidebarContext.jsx";
import Sidebar   from "../components/menubars/Sidebar.jsx";
import Topbar    from "../components/menubars/Topbar.jsx";
import ImpersonationBanner from "../components/admin/ImpersonationBanner.jsx";
import { usePageTitle } from "../hooks/usePageTitle.js";
import { stopImpersonation } from "../redux/auth/authSlice.js";
import { getUserDashboards, getRoleHome } from "../components/auth/RoleGuard.jsx";

function LayoutShell({ navItems }) {
  const title      = usePageTitle();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user, impersonating, adminSnapshot } = useSelector((s) => s.auth);

  const dashboards = getUserDashboards(user);  // [{role, path}] — only populated when user has extra_roles

  const handleSwitchDashboard = (path) => navigate(path);

  const handleExitImpersonation = () => {
    dispatch(stopImpersonation());
    navigate(getRoleHome(adminSnapshot?.role || "SUPER_ADMIN"), { replace: true });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Impersonation banner — sits at very top, above everything */}
      {impersonating && (
        <ImpersonationBanner onExit={handleExitImpersonation} />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar navItems={navItems} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar
            title={title}
            dashboards={dashboards}
            currentUser={user}
            onSwitchDashboard={handleSwitchDashboard}
          />

          <main className="flex-1 overflow-y-auto">
            <div className="p-5 md:p-6 max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ navItems }) {
  return (
    <SidebarProvider>
      <LayoutShell navItems={navItems} />
    </SidebarProvider>
  );
}