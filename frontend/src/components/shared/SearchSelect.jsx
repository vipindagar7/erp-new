// src/components/shared/SearchSelect.jsx
// Reusable searchable select — types to search server-side, shows results in dropdown.
// Handles unlimited options (no pre-loading needed).
//
// Usage:
//   <SearchSelect
//     endpoint={EP.programs.list}       // API endpoint to search
//     searchParam="search"              // query param name for search text (default: "search")
//     extraParams={{ limit: 30 }}       // extra fixed query params
//     valueKey="id"                     // which field is the value (default: "id")
//     labelKey="name"                   // which field is the display label (default: "name")
//     subLabelKey="department.name"     // optional: dotted path for a sub-label (e.g. "department.name")
//     dataPath="programs"               // dotted path into res.data.data to get the array
//     value={form.program_id}           // controlled value
//     onChange={(id, option) => ...}    // called with (value, fullObject)
//     placeholder="Search programs…"
//     selectedLabel="B.Tech CSE"        // label to show when value is set but not in current list
//     error={!!errors.program_id}
//     disabled={false}
//   />

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown, X, Loader2, Check } from "lucide-react";
import axiosInstance from "../../lib/axios.js";

// ── Helpers ───────────────────────────────────────────────────
const getNestedValue = (obj, path) => {
  if (!path || !obj) return undefined;
  return path.split(".").reduce((acc, k) => acc?.[k], obj);
};

// ─────────────────────────────────────────────────────────────
export default function SearchSelect({
  endpoint,
  searchParam   = "search",
  extraParams   = {},
  valueKey      = "id",
  labelKey      = "name",
  subLabelKey,
  dataPath,
  value,
  onChange,
  placeholder   = "Search…",
  selectedLabel,
  error         = false,
  disabled      = false,
  className     = "",
}) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const timer        = useRef(null);

  // Display label for current value
  const currentOption = options.find((o) => getNestedValue(o, valueKey) === value);
  const displayLabel  = currentOption
    ? getNestedValue(currentOption, labelKey)
    : (selectedLabel || (value ? "…" : ""));

  // ── Fetch options ────────────────────────────────────────────
  const fetchOptions = useCallback(
    async (q) => {
      if (!endpoint) return;
      setLoading(true);
      try {
        const params = { ...extraParams, limit: 30 };
        if (q) params[searchParam] = q;
        const res  = await axiosInstance.get(endpoint, { params });
        let data   = res.data?.data ?? [];
        if (dataPath) data = getNestedValue(data, dataPath) ?? data;
        if (!Array.isArray(data)) data = [];
        setOptions(data);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [endpoint, searchParam, dataPath, JSON.stringify(extraParams)],
  );

  // Initial load (show top options when dropdown opens with no query)
  useEffect(() => {
    if (open) {
      fetchOptions(query);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search as user types
  useEffect(() => {
    if (!open) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchOptions(query), 250);
    return () => clearTimeout(timer.current);
  }, [query, open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (option) => {
    onChange(getNestedValue(option, valueKey), option);
    setOpen(false);
    setQuery("");
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("", null);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={[
          "w-full flex items-center gap-2 h-10 px-3 rounded-md border text-sm text-left",
          "bg-background transition-colors",
          error       ? "border-destructive" : "border-input",
          disabled    ? "opacity-50 cursor-not-allowed" : "hover:border-ring cursor-pointer",
          open        ? "border-ring ring-2 ring-ring/20" : "",
        ].join(" ")}
      >
        <span className={`flex-1 truncate ${!value ? "text-muted-foreground" : ""}`}>
          {value ? displayLabel : placeholder}
        </span>
        {value && !disabled && (
          <X size={14} className="text-muted-foreground hover:text-foreground shrink-0" onClick={clear} />
        )}
        <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 size={13} className="animate-spin text-muted-foreground shrink-0" />}
          </div>

          {/* Options list */}
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                {loading ? "Searching…" : query ? "No results" : "Start typing to search"}
              </li>
            ) : options.map((opt) => {
              const optVal   = getNestedValue(opt, valueKey);
              const optLabel = getNestedValue(opt, labelKey);
              const optSub   = subLabelKey ? getNestedValue(opt, subLabelKey) : null;
              const selected = optVal === value;

              return (
                <li
                  key={optVal}
                  onClick={() => select(opt)}
                  className={[
                    "flex items-center gap-2 px-3 py-2 cursor-pointer text-sm",
                    selected ? "bg-primary/10 text-primary" : "hover:bg-muted",
                  ].join(" ")}
                >
                  <Check size={13} className={selected ? "opacity-100 text-primary" : "opacity-0"} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{optLabel}</p>
                    {optSub && <p className="text-xs text-muted-foreground truncate">{optSub}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
