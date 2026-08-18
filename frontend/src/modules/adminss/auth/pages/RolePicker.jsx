// frontend/src/pages/auth/RolePicker.jsx
// ─────────────────────────────────────────────────────────────
// Shown at login when user has multiple roles.
// Also accessible from Topbar "Switch Dashboard" menu.
// ─────────────────────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setActiveRole } from "../../../../redux/auth/authSlice.js";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { cn } from "../../../../lib/utils.js";
import {
  Shield, Building2, Users, BookOpen, Layout,
  GraduationCap, DollarSign, Library, Briefcase, Loader2
} from "lucide-react";

const ROLE_ICONS = {
  SUPER_ADMIN: Shield,
  ADMIN: Building2,
  HOD: Users,
  FACULTY: BookOpen,
  CLASS_COORDINATOR: Layout,
  STUDENT: GraduationCap,
  ACCOUNTANT: DollarSign,
  LIBRARIAN: Library,
  TRAINING_AND_PLACEMENT_OFFICER: Briefcase,
};

const ROLE_COLORS = {
  SUPER_ADMIN: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-300",
  ADMIN: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300",
  HOD: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300",
  FACULTY: "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-800 dark:text-teal-300",
  CLASS_COORDINATOR: "bg-cyan-50 border-cyan-200 text-cyan-700 dark:bg-cyan-950/20 dark:border-cyan-800 dark:text-cyan-300",
  STUDENT: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300",
  ACCOUNTANT: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300",
  LIBRARIAN: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300",
  TRAINING_AND_PLACEMENT_OFFICER: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300",
};

// ── Role card ─────────────────────────────────────────────────
function RoleCard({ dashboard, selected, onClick }) {
  const Icon = ROLE_ICONS[dashboard.role_name] || Shield;
  const color = ROLE_COLORS[dashboard.role_name] || ROLE_COLORS.ADMIN;

  return (
    <button
      onClick={() => onClick(dashboard)}
      className={cn(
        "w-full text-left p-4 rounded-2xl border-2 transition-all",
        "hover:shadow-md hover:-translate-y-0.5",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-border/80"
      )}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl border", color)}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{dashboard.label}</p>
          {dashboard.dept_id && (
            <p className="text-xs text-muted-foreground mt-0.5">Department scoped</p>
          )}
          {dashboard.section_id && (
            <p className="text-xs text-muted-foreground mt-0.5">Section scoped</p>
          )}
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Full-page role picker (shown at login) ────────────────────
export default function RolePickerPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, dashboards } = useSelector((s) => s.auth);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (dashboard) => {
    setSelected(dashboard.role_id);
    setLoading(true);
    try {
      const r = await axiosInstance.patch(EP.auth.switchRole, { role_id: dashboard.role_id });
      dispatch(setActiveRole({
        role: dashboard.role_name,
        permissions: r.data?.data?.permissions || [],
        scope: r.data?.data?.scope || {},
      }));
      navigate(dashboard.path, { replace: true });
    } catch (e) {
      notify.error(e.response?.data?.message || "Failed to switch role");
      setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <img src="/Black-Logo.webp" alt="ERP Logo" className="w-60 block dark:hidden object-contain" />
          <img src="/White-Logo.webp" alt="ERP Logo" className="w-60 hidden dark:block object-contain" />
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            You have multiple roles. Choose your dashboard for this session.
          </p>
        </div>

        {/* Role list */}
        <div className="space-y-3">
          {(dashboards || []).map((dashboard) => (
            <RoleCard
              key={dashboard.role_id}
              dashboard={dashboard}
              selected={selected === dashboard.role_id}
              onClick={handleSelect}
            />
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            Switching dashboard…
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          You can switch between dashboards at any time from the top menu.
        </p>
      </div>
    </div>
  );
}

// ── Inline switcher (used in Topbar dropdown) ─────────────────
export function DashboardSwitcher({ dashboards, currentRole, onSwitch }) {
  const [loading, setLoading] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSwitch = async (dashboard) => {
    if (dashboard.role_name === currentRole) return;
    setLoading(dashboard.role_id);
    try {
      const r = await axiosInstance.patch(EP.auth.switchRole, { role_id: dashboard.role_id });
      dispatch(setActiveRole({
        role: dashboard.role_name,
        permissions: r.data?.data?.permissions || [],
        scope: r.data?.data?.scope || {},
      }));
      navigate(dashboard.path, { replace: true });
      onSwitch?.();
    } catch (e) {
      notify.error("Failed to switch dashboard");
    } finally {
      setLoading(null);
    }
  };

  if (!dashboards || dashboards.length <= 1) return null;

  return (
    <div className="py-1">
      <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        Switch Dashboard
      </p>
      {dashboards.map((dashboard) => {
        const Icon = ROLE_ICONS[dashboard.role_name] || Shield;
        const isActive = dashboard.role_name === currentRole;
        const isLoading = loading === dashboard.role_id;
        return (
          <button
            key={dashboard.role_id}
            onClick={() => handleSwitch(dashboard)}
            disabled={isActive || !!loading}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
              isActive
                ? "text-foreground font-medium bg-muted/50 cursor-default"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}>
            {isLoading
              ? <Loader2 size={15} className="animate-spin shrink-0" />
              : <Icon size={15} className="shrink-0" />
            }
            <span className="flex-1 text-left">{dashboard.label}</span>
            {isActive && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}