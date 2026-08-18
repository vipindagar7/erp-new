// src/components/shared/FilterPanel.jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "../../lib/utils.js";

// filters = [{ key, label, type: "select"|"toggle", options, value, onChange }]
export function FilterPanel({ filters = [], className }) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {filters.map((f) => {
        if (f.type === "select") return (
          <Select key={f.key} value={f.value || "all"} onValueChange={(v) => f.onChange(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-sm min-w-[140px]">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.label} (All)</SelectItem>
              {(f.options || []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        );
        if (f.type === "toggle") return (
          <button key={f.key} onClick={() => f.onChange(!f.value)}
            className={cn("h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
              f.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted")}>
            {f.label}
          </button>
        );
        return null;
      })}
    </div>
  );
}
export default FilterPanel;
