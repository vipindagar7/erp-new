// src/components/layout/AppShell.jsx
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Sidebar } from "../components/bars/Sidebar.jsx";
import { Topbar } from "../components/bars/Topbar.jsx";
import ImpersonationBanner from "../components/shared/ImpersonationBanner.jsx";
import { SidebarProvider } from "../hooks/sidebarContext.jsx";
import { stopImpersonation } from "../redux/auth/authSlice.js";

export function AppShell({
  navItems = [],
  moduleNavItems = null,   // pass from layout when inside a module
  moduleName = "",         // e.g. "Students"
  dashboardLabel,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { impersonating, user } = useSelector((s) => s.auth ?? {});

  const handleExitImpersonation = () => {
    dispatch(stopImpersonation());
    navigate("/admin");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar
          navItems={navItems}
          moduleNavItems={moduleNavItems}
          moduleName={moduleName}
          dashboardLabel={dashboardLabel}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {impersonating && (
            <ImpersonationBanner onExit={handleExitImpersonation} />
          )}
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}