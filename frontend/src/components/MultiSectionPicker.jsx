import { useState } from "react";
import { cn } from "../lib/utils.js";

// Format: "BTech CSE Sem4 A"  (compact, no overflow)
export const formatSection = (s, { compact = false } = {}) => {
  const prog  = s.course?.program?.name || "";
  const course = s.course?.name || "";
  const sem   = s.semester ? `Sem ${s.semester}` : "";
  const sec   = `Sec ${s.name}`;
  if (compact) {
    // "BTech CSE Sem4 A" — no punctuation, fits filter chips
    return [prog, course, sem, sec].filter(Boolean).join(" ");
  }
  // Full: "BTech › CSE › Sem 4 › Sec A · 2023-2027"
  const parts = [prog, course, sem, sec].filter(Boolean).join(" › ");
  return s.batch ? `${parts} · ${s.batch}` : parts;
};

// Short label for chips/badges: "CSE Sem4 A"
export const shortSection = (s) => {
  const course = s.course?.name || "";
  const sem    = s.semester ? `Sem ${s.semester}` : "";
  const sec    = `Sec ${s.name}`;
  return [course, sem, sec].filter(Boolean).join(" ");
};

export default function MultiSectionPicker({ sections = [], selected = new Set(), onChange, maxHeight = "max-h-72", groupByCourse = true }) {
  const [search, setSearch] = useState("");

  const filtered = sections.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.batch?.toLowerCase().includes(q) ||
      s.course?.name?.toLowerCase().includes(q) ||
      s.course?.program?.name?.toLowerCase().includes(q) ||
      String(s.semester)?.includes(q)
    );
  });

  const grouped = groupByCourse
    ? filtered.reduce((acc, s) => {
        const key = [s.course?.program?.name, s.course?.name].filter(Boolean).join(" › ") || "Other";
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
      }, {})
    : { All: filtered };

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(next);
  };

  const toggleGroup = (groupSections) => {
    const ids = groupSections.map((s) => s.id);
    const allSel = ids.every((id) => selected.has(id));
    const next = new Set(selected);
    allSel ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id));
    onChange(next);
  };

  const toggleAll = () => {
    const allIds = filtered.map((s) => s.id);
    const allSel = allIds.every((id) => selected.has(id));
    const next = new Set(selected);
    allSel ? allIds.forEach((id) => next.delete(id)) : allIds.forEach((id) => next.add(id));
    onChange(next);
  };

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input className="w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search by name, course, program, batch…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length > 0 && (
        <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-primary hover:underline">
          <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center", allSelected ? "bg-primary border-primary" : "border-muted-foreground")}>
            {allSelected && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          {allSelected ? "Deselect all" : `Select all (${filtered.length})`}
        </button>
      )}

      <div className={cn("overflow-y-auto border border-border rounded-xl divide-y divide-border", maxHeight)}>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">No sections found</div>
        )}
        {Object.entries(grouped).map(([group, groupSections]) => {
          const groupSelCount = groupSections.filter((s) => selected.has(s.id)).length;
          const groupAllSel   = groupSelCount === groupSections.length;
          return (
            <div key={group}>
              {Object.keys(grouped).length > 1 && (
                <button onClick={() => toggleGroup(groupSections)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-xs font-semibold text-muted-foreground">{group}</span>
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    groupAllSel ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {groupSelCount}/{groupSections.length}
                  </span>
                </button>
              )}
              {groupSections.map((s) => {
                const isSel = selected.has(s.id);
                return (
                  <button key={s.id} onClick={() => toggle(s.id)}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40", isSel && "bg-primary/5")}>
                    <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSel ? "bg-primary border-primary" : "border-muted-foreground")}>
                      {isSel && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        <span className="text-primary">Sec {s.name}</span>
                        <span className="text-muted-foreground"> · Sem {s.semester}</span>
                        {s.batch && <span className="text-muted-foreground"> · {s.batch}</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {[s.course?.program?.name, s.course?.name].filter(Boolean).join(" › ")}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground">{selected.size} section{selected.size !== 1 ? "s" : ""} selected</p>
      )}
    </div>
  );
}