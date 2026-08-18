// src/components/shared/PermissionChecklist.jsx
// ─────────────────────────────────────────────
// Accordion permission picker — grouped by module, CRUD preset toggle.
// Used in AdminsPage (create/edit admin) and RoleManagementPage (grant role).
//
// Props:
//   value    — string[]  selected permission keys
//   onChange — (string[]) => void
//   compact  — bool  smaller padding (for inline use)
// ─────────────────────────────────────────────
import { useState } from "react";
import { cn } from "../../lib/utils.js";
import { PERMISSION_MODULES, getCRUDPreset } from "../../config/permission.config.js";
import { ChevronDown, Check } from "lucide-react";

function ModuleSection({ mod, selected, onChange, compact }) {
  const [open, setOpen] = useState(false);

  const modKeys     = mod.permissions.map((p) => p.key);
  const crudKeys    = getCRUDPreset(mod.key);
  const allSelected = modKeys.every((k) => selected.includes(k));
  const anySelected = modKeys.some((k) => selected.includes(k));
  const crudAllSel  = crudKeys.length > 0 && crudKeys.every((k) => selected.includes(k));

  const toggleAll = () => {
    if (allSelected) onChange(selected.filter((k) => !modKeys.includes(k)));
    else             onChange([...new Set([...selected, ...modKeys])]);
  };

  const toggleCRUD = () => {
    if (crudAllSel) onChange(selected.filter((k) => !crudKeys.includes(k)));
    else            onChange([...new Set([...selected, ...crudKeys])]);
  };

  const toggleOne = (key) => {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else                        onChange([...selected, key]);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Module header */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 transition-colors text-left",
          anySelected ? "bg-primary/5" : "bg-muted/20 hover:bg-muted/40"
        )}
      >
        <div className="flex items-center gap-2.5">
          {/* Module select-all checkbox */}
          <div
            role="checkbox"
            aria-checked={allSelected}
            onClick={(e) => { e.stopPropagation(); toggleAll(); }}
            className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer",
              allSelected   ? "border-primary bg-primary" :
              anySelected   ? "border-primary bg-primary/30" : "border-muted-foreground/40"
            )}
          >
            {(allSelected || anySelected) && <Check size={9} className="text-white" strokeWidth={3} />}
          </div>
          <span className="text-sm">{mod.icon}</span>
          <span className="text-sm font-semibold text-foreground">{mod.label}</span>
          {anySelected && (
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {modKeys.filter((k) => selected.includes(k)).length}/{modKeys.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* CRUD preset shortcut */}
          {crudKeys.length > 0 && open && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleCRUD(); }}
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors",
                crudAllSel
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              CRUD
            </button>
          )}
          <ChevronDown size={13} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {/* Permission list */}
      {open && (
        <div className={cn("divide-y divide-border border-t border-border", compact ? "" : "")}>
          {mod.permissions.map((p) => {
            const checked = selected.includes(p.key);
            return (
              <label
                key={p.key}
                className={cn(
                  "flex items-start gap-3 cursor-pointer transition-colors",
                  compact ? "px-3 py-2" : "px-4 py-2.5",
                  checked ? "bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}>
                  {checked && <Check size={9} className="text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="sr-only"
                  checked={checked} onChange={() => toggleOne(p.key)} />
                <div className="min-w-0">
                  <p className={cn("font-medium text-foreground leading-none", compact ? "text-xs" : "text-sm")}>
                    {p.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-mono">{p.key}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PermissionChecklist({ value = [], onChange, compact = false }) {
  const allKeys    = PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => p.key));
  const allSelected = allKeys.every((k) => value.includes(k));

  return (
    <div className="space-y-2">
      {/* Global select all / clear */}
      <div className="flex items-center justify-between">
        <p className={cn("font-semibold text-muted-foreground uppercase tracking-wide", compact ? "text-[10px]" : "text-xs")}>
          Permissions
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={() => onChange(allKeys)}
            className="text-xs text-primary hover:underline">Select all</button>
          <button type="button" onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:underline">Clear all</button>
        </div>
      </div>

      {/* Module accordions */}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
        {PERMISSION_MODULES.map((mod) => (
          <ModuleSection
            key={mod.key}
            mod={mod}
            selected={value}
            onChange={onChange}
            compact={compact}
          />
        ))}
      </div>

      {/* Summary */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} of {allKeys.length} permissions selected
        </p>
      )}
    </div>
  );
}
