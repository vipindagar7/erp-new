import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserDashboards, getRoleHome } from "../auth/RoleGuard.jsx";
import { cn } from "../../lib/utils.js";
import { ArrowLeftRight } from "lucide-react";

const ROLE_META = {
  SUPER_ADMIN: { label: "Super Admin", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  ADMIN:       { label: "Admin",       cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  FACULTY:     { label: "Faculty",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  STUDENT:     { label: "Student",     cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

/**
 * Shows a switcher button when the user has extra_roles.
 * Place this in your layout headers (AdminLayout, FacultyLayout, StudentLayout).
 * 
 * Usage:
 *   import DashboardSwitcher from "../components/DashboardSwitcher.jsx";
 *   <DashboardSwitcher />
 */
export default function DashboardSwitcher() {
  const { user }     = useSelector((s) => s.auth);
  const navigate     = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboards = getUserDashboards(user);
  if (dashboards.length <= 1) return null; // only show if multiple roles

  const currentPath = window.location.pathname.split("/")[1]; // "admin" | "faculty" | "student"

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Switch dashboard"
      >
        <ArrowLeftRight size={13} />
        <span className="hidden sm:inline">Switch view</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-popover border border-border rounded-xl shadow-xl overflow-hidden py-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Your dashboards
            </p>
            {dashboards.map(({ role, path }) => {
              const m = ROLE_META[role];
              const isCurrent = path.replace("/","") === currentPath;
              return (
                <button key={role} onClick={() => { navigate(path); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors",
                    isCurrent ? "bg-primary/5 text-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0", m?.cls)}>
                    {m?.label}
                  </span>
                  <span className="text-xs">{path}</span>
                  {isCurrent && <span className="ml-auto text-[10px] text-primary font-semibold">current</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}