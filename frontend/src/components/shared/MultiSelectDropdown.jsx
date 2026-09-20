// src/components/shared/MultiSelectDropdown.jsx
// Generic multi-select dropdown for filter bars — checkbox list + search + select-all/clear.
// Usage:
//   <MultiSelectDropdown
//     label="Batch"
//     options={[{ value: "2022-2026", label: "2022-2026" }, ...]}
//     selected={batchFilter}                // array of selected values
//     onChange={setBatchFilter}             // receives the new array
//     placeholder="All batches"
//     loading={loadingBatches}
//   />
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check, Loader2 } from "lucide-react";

export default function MultiSelectDropdown({
  label,
  options = [],          // [{ value, label, sublabel? }]
  selected = [],          // array of selected values
  onChange,               // (nextArray) => void
  placeholder = "All",
  loading = false,
  searchable = true,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const selectAll = () => onChange(filtered.map((o) => o.value));
  const clearAll = () => onChange([]);

  const summary = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", ")
      : `${selected.length} selected`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full h-10 px-3 rounded-md border border-input bg-background text-sm flex items-center gap-2 min-w-[10rem] justify-between
          ${selected.length > 0 ? "border-primary/50 text-foreground" : "text-muted-foreground"}`}
      >
        <span className="truncate">{label ? `${label}: ${summary}` : summary}</span>
        <span className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
              {selected.length}
            </span>
          )}
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-64 max-h-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg flex flex-col">
          {searchable && (
            <div className="p-2 border-b border-border relative shrink-0">
              <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full h-8 pl-7 pr-2 rounded-lg border border-input bg-background text-xs outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border text-[11px] shrink-0">
            <button onClick={selectAll} className="text-primary hover:underline">Select all</button>
            <button onClick={clearAll} className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X size={10} /> Clear
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No options found</p>
            ) : filtered.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <label key={o.value}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer hover:bg-muted/50 ${checked ? "bg-primary/5" : ""}`}>
                  <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${checked ? "bg-primary border-primary" : "border-input"}`}>
                    {checked && <Check size={10} className="text-primary-foreground" />}
                  </span>
                  <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(o.value)} />
                  <span className="flex-1 truncate">
                    {o.label}
                    {o.sublabel && <span className="text-muted-foreground ml-1">· {o.sublabel}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}