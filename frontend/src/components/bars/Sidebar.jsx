// src/components/bars/Sidebar.jsx
// Permission-filtered sidebar — flat list, effectivePermissions based
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSidebar } from "../../hooks/sidebarContext.jsx";
import { SidebarModeToggle } from "../layout/SidebarModeToggle.jsx";
import { useSidebarMode, SIDEBAR_MODE } from "../../hooks/useSidebarMode.js";
import { PanelLeftClose, PanelLeftOpen, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "../../lib/utils.js";

// ── Permission check ───────────────────────────────────────────
const canSeeItem = (item, user) => {
  if (!user) return false;
  if (item.type === "divider") return true;
  if (item.superOnly) return user.role === "SUPER_ADMIN";
  if (item.rootOnly)  return user.is_root === true || user.role === "SUPER_ADMIN";
  if (!item.permission) return true;
  if (user.role === "SUPER_ADMIN") return true;
  const perms = user.effectivePermissions || user.permissions || [];
  return perms.includes(item.permission);
};

// ── Logo ───────────────────────────────────────────────────────
function Logo({ collapsed }) {
  return (
    <div className="flex items-center px-4 py-5 border-b border-sidebar-border h-[65px] shrink-0">
      {collapsed
        ? <img src="/favicon.ico" alt="EIT" className="w-8 h-8 object-contain"/>
        : (
          <>
            <img src="/Black-Logo.webp" alt="EIT ERP" className="w-52 object-contain block dark:hidden"/>
            <img src="/White-Logo.webp" alt="EIT ERP" className="w-52 object-contain hidden dark:block"/>
          </>
        )
      }
    </div>
  );
}

// ── Single nav item ────────────────────────────────────────────
function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive = item.end
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);
  const Icon = item.icon;

  const inner = item.disabled ? (
    <div className={cn(
      "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm opacity-40 cursor-not-allowed select-none",
      collapsed && "justify-center px-2"
    )}>
      <Icon size={17} className="shrink-0 text-sidebar-icon"/>
      {!collapsed && (
        <>
          <span className="flex-1 whitespace-nowrap overflow-hidden text-sidebar-muted">{item.label}</span>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Soon</span>
        </>
      )}
    </div>
  ) : (
    <NavLink to={item.path} end={item.end}
      className={cn(
        "group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
        isActive && "bg-sidebar-active text-sidebar-active-fg font-semibold",
        collapsed && "justify-center px-2"
      )}>
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-violet-500"/>
      )}
      <Icon size={17} className={cn(
        "shrink-0 transition-colors",
        isActive ? "text-violet-500 dark:text-violet-400" : "text-sidebar-icon group-hover:text-sidebar-foreground"
      )}/>
      {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
      {isActive && collapsed && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500"/>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}{item.disabled ? " — Coming Soon" : ""}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return inner;
}

// ── Divider ────────────────────────────────────────────────────
function Divider({ item, collapsed }) {
  if (collapsed) return <div className="mx-3 my-1.5"><div className="h-px bg-sidebar-border"/></div>;
  return (
    <div className="mx-4 mt-4 mb-1">
      {item.label && (
        <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider px-1">{item.label}</p>
      )}
    </div>
  );
}

// ── Accordion section (for grouped nav) ───────────────────────
function NavSection({ section, collapsed }) {
  const location = useLocation();
  const SectionIcon = section.icon;
  const hasActive = section.items.some(item =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );
  const [open, setOpen] = useState(hasActive);
  useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

  if (collapsed) {
    return (
      <div>
        <div className="space-y-0.5">
          {section.items.map(item => <NavItem key={item.key} item={item} collapsed/>)}
        </div>
        <div className="mx-3 my-1.5"><div className="h-px bg-sidebar-border"/></div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen(p => !p)}
        className={cn(
          "w-full flex items-center justify-between px-4 pt-4 pb-1.5 transition-colors",
          "text-[10px] font-semibold uppercase tracking-[0.1em] select-none",
          hasActive ? "text-sidebar-foreground" : "text-sidebar-muted hover:text-sidebar-foreground"
        )}>
        <div className="flex items-center gap-2">
          {SectionIcon && (
            <SectionIcon size={12} className={cn(hasActive ? "text-violet-500 dark:text-violet-400" : "text-sidebar-muted")}/>
          )}
          <span>{section.label}</span>
        </div>
        <ChevronDown size={12} className={cn("transition-transform duration-200", open ? "rotate-180" : "")}/>
      </button>
      <div className={cn("overflow-hidden transition-all duration-200", open ? "max-h-screen opacity-100" : "max-h-0 opacity-0 pointer-events-none")}>
        <div className="space-y-0.5 pb-1">
          {section.items.map(item => <NavItem key={item.key} item={item} collapsed={false}/>)}
        </div>
      </div>
    </div>
  );
}

// ── Flat nav (permission filtered flat list) ───────────────────
function FlatNav({ items, collapsed, user }) {
  return (
    <div className="space-y-0.5 py-2">
      {items.filter(item => canSeeItem(item, user)).map(item => {
        if (item.type === "divider") return <Divider key={item.key} item={item} collapsed={collapsed}/>;
        return <NavItem key={item.key} item={item} collapsed={collapsed}/>;
      })}
    </div>
  );
}

// ── Main Sidebar export ────────────────────────────────────────
export function Sidebar({ navItems = [], moduleNavItems = null, moduleName = "" }) {
  const { collapsed, toggle } = useSidebar();
  const { user }              = useSelector(s => s.auth);
  const { mode, toggle: toggleMode } = useSidebarMode();

  const hasModuleNav  = moduleNavItems && moduleNavItems.length > 0;
  const showingModule = hasModuleNav && mode === SIDEBAR_MODE.MODULE;

  // Build grouped sections, filtering by effectivePermissions
  const sections = (() => {
    if (!navItems.length) return [];
    // Already grouped
    if (navItems[0]?.items) {
      return navItems
        .map(s => ({ ...s, items: s.items.filter(item => canSeeItem(item, user)) }))
        .filter(s => s.items.length > 0);
    }
    // Flat array with group markers
    const result = [];
    let current  = null;
    for (const item of navItems) {
      if (item.group) {
        current = { label: item.group, icon: item.groupIcon || null, items: [] };
        result.push(current);
      } else if (canSeeItem(item, user)) {
        if (!current) { current = { label: "", icon: null, items: [] }; result.push(current); }
        current.items.push(item);
      }
    }
    return result.filter(s => s.items.length > 0);
  })();

  return (
    <aside className={cn(
      "relative flex flex-col h-full shrink-0 transition-all duration-200",
      "bg-sidebar border-r border-sidebar-border",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>
      <Logo collapsed={collapsed}/>

      {hasModuleNav && (
        <SidebarModeToggle
          mode={mode}
          onToggle={toggleMode}
          moduleName={moduleName}
          collapsed={collapsed}
        />
      )}

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
        {showingModule
          ? <FlatNav items={moduleNavItems || []} collapsed={collapsed} user={user}/>
          : sections.map((section, i) => (
              <NavSection key={section.label || i} section={section} collapsed={collapsed}/>
            ))
        }
      </nav>

      {/* User pill at bottom */}
      {!collapsed && user && (
        <div className="px-3 pb-2 border-t border-sidebar-border pt-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-sidebar-hover cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
              {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-sidebar-muted truncate">{user.role}</p>
            </div>
          </div>
        </div>
      )}

      <div className={cn("p-3 border-t border-sidebar-border", collapsed ? "flex justify-center" : "flex justify-end")}>
        <button onClick={toggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover">
          {collapsed ? <PanelLeftOpen size={16}/> : <PanelLeftClose size={16}/>}
        </button>
      </div>
    </aside>
  );
}