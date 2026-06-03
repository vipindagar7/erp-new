import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSidebar } from "../../hooks/sidebarContext.jsx";
import { PanelLeftClose, PanelLeftOpen, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "../../lib/utils.js";

function Logo({ collapsed }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border transition-all duration-300",
    )}>
      {collapsed &&
        <div>
          <img src="/favicon.ico" alt="ERP Logo" />
        </div>}
      {!collapsed && (
        <div className="flex items-center gap-3 overflow-hidden">
          <img src="/Black-Logo.webp" alt="ERP Logo" className="w-60 block dark:hidden object-contain" />
          <img src="/White-Logo.webp" alt="ERP Logo" className="w-60 hidden dark:block object-contain" />
        </div>
      )}
    </div>
  );
}

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive = item.end
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  const Icon = item.icon;

  const inner = (
    <NavLink
      to={item.path}
      end={item.end}
      className={cn(
        "group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
        isActive && "bg-sidebar-active text-sidebar-active-fg font-semibold",
        collapsed && "justify-center px-2"
      )}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-500" />
      )}
      <Icon
        size={18}
        className={cn(
          "shrink-0 transition-colors",
          isActive ? "text-violet-500 dark:text-violet-400" : "text-sidebar-icon group-hover:text-sidebar-foreground"
        )}
      />
      {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
      {isActive && collapsed && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return inner;
}

// ── Accordion section ──────────────────────────────────────────
function NavSection({ section, collapsed }) {
  const location = useLocation();
  const SectionIcon = section.icon;

  const hasActive = section.items.some((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  const [open, setOpen] = useState(hasActive);

  // Auto-open when navigating into a child route
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  // Collapsed mode — show all items as icon tooltips with a divider between sections
  if (collapsed) {
    return (
      <div>
        <div className="space-y-0.5">
          {section.items.map((item) => (
            <NavItem key={item.key} item={item} collapsed />
          ))}
        </div>
        <div className="mx-3 my-1.5">
          <div className="h-px bg-sidebar-border" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Section header — clickable to toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between px-4 pt-4 pb-1.5 transition-colors",
          "text-[10px] font-semibold uppercase tracking-[0.1em] select-none",
          hasActive ? "text-sidebar-foreground" : "text-sidebar-muted hover:text-sidebar-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          {SectionIcon && (
            <SectionIcon
              size={12}
              className={cn(hasActive ? "text-violet-500 dark:text-violet-400" : "text-sidebar-muted")}
            />
          )}
          <span className="whitespace-nowrap overflow-hidden">{section.label}</span>
        </div>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-200 shrink-0",
            open ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Items — animated open/close */}
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        open ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none"
      )}>
        <div className="space-y-0.5 pb-1">
          {section.items.map((item) => (
            <NavItem key={item.key} item={item} collapsed={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main sidebar ───────────────────────────────────────────────
export default function Sidebar({ navItems }) {
  const { collapsed, toggle } = useSidebar();
  const { user } = useSelector((s) => s.auth);

  // Filter items by permission
  const filterItem = (item) => {
    if (item.superOnly) return user?.role === "SUPER_ADMIN";
    if (!item.permission) return true;
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    // Support both flat keys ("manage_students") and dotted keys ("students.view")
    return user.permissions?.includes(item.permission) ||
      user.permissions?.some((p) => item.permission.startsWith(p.split(".")[0]));
  };

  // Convert flat navItems array into grouped sections
  // navItems format: [{ group: "People" }, { key, path, label, icon }, ...]
  // OR already-grouped: [{ label, icon, items: [...] }]
  const sections = (() => {
    // Already grouped format
    if (navItems[0]?.items) {
      return navItems.map((s) => ({
        ...s,
        items: s.items.filter(filterItem),
      })).filter((s) => s.items.length > 0);
    }

    // Flat format with group separators
    const result = [];
    let current = null;
    for (const item of navItems) {
      if (item.group) {
        current = { label: item.group, icon: item.icon || null, items: [] };
        result.push(current);
      } else if (filterItem(item)) {
        if (!current) {
          current = { label: "", icon: null, items: [] };
          result.push(current);
        }
        current.items.push(item);
      }
    }
    return result.filter((s) => s.items.length > 0);
  })();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full shrink-0 transition-all duration-200",
        "bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <Logo collapsed={collapsed} />

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
        {sections.map((section, i) => (
          <NavSection
            key={section.label || i}
            section={section}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        collapsed ? "flex justify-center" : "flex justify-end"
      )}>
        <button
          onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
    </aside>
  );
}