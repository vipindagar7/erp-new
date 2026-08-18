// src/components/layout/SidebarModeToggle.jsx
// Compact toggle shown at the top of the sidebar when inside a module.
// Switches between Main Nav and Module Nav.
import { LayoutDashboard, Layers } from "lucide-react";
import { cn } from "../../lib/utils.js";
import { SIDEBAR_MODE } from "../../hooks/useSidebarMode.js";

export function SidebarModeToggle({ mode, onToggle, moduleName, collapsed }) {
  const isMain = mode === SIDEBAR_MODE.MAIN;

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        title={isMain ? `Switch to ${moduleName}` : "Switch to Main Nav"}
        className="mx-auto mt-2 mb-1 flex items-center justify-center w-8 h-8 rounded-lg
          bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        {isMain ? <Layers size={15} /> : <LayoutDashboard size={15} />}
      </button>
    );
  }

  return (
    <div className="mx-3 mt-3 mb-1 flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
      <button
        onClick={() => mode !== SIDEBAR_MODE.MAIN && onToggle()}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs font-medium transition-all",
          isMain
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutDashboard size={12} />
        Main
      </button>
      <button
        onClick={() => mode !== SIDEBAR_MODE.MODULE && onToggle()}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg text-xs font-medium transition-all",
          !isMain
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Layers size={12} />
        {moduleName}
      </button>
    </div>
  );
}
