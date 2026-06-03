import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Check, Layers } from "lucide-react";
import { cn } from "../../lib/utils.js";

/**
 * SectionSelector
 * A fully searchable dropdown for selecting a section.
 * Shows: Section Name · Course · Program · Department · Sem · Batch
 *
 * Props:
 *   sections   — array of section objects from Redux
 *   value      — selected section id (string)
 *   onChange   — (id: string) => void
 *   placeholder — string
 *   disabled   — bool
 *   error      — bool (red border)
 */
export default function SectionSelector({
    sections = [],
    value,
    onChange,
    placeholder = "Select section…",
    disabled = false,
    error = false,
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);
    const inputRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50);
        else setSearch("");
    }, [open]);

    const selected = sections.find((s) => s.id === value);

    // Filter sections by search — matches name, course, program, dept, batch, room
    const filtered = sections.filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            s.name?.toLowerCase().includes(q) ||
            s.course?.name?.toLowerCase().includes(q) ||
            s.course?.program?.name?.toLowerCase().includes(q) ||
            s.course?.program?.department?.name?.toLowerCase().includes(q) ||
            s.batch?.toLowerCase().includes(q) ||
            s.room_no?.toLowerCase().includes(q) ||
            String(s.semester).includes(q)
        );
    });

    const handleSelect = (id) => {
        onChange(id);
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "w-full h-9 px-3 flex items-center justify-between gap-2 rounded-lg border text-sm transition-colors",
                    "bg-background text-left",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                    error
                        ? "border-destructive focus:ring-destructive/30"
                        : open
                            ? "border-ring ring-2 ring-ring/30"
                            : "border-input hover:border-ring/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span className="flex-1 truncate">
                    {selected ? (
                        <span className="flex items-center gap-2 min-w-0">
                            <Layers size={13} className="text-muted-foreground shrink-0" />
                            <span className="font-medium text-foreground truncate">{selected.name}</span>
                            <span className="text-muted-foreground text-xs hidden sm:inline truncate">
                                · {selected.course?.name}
                            </span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </span>
                <span className="flex items-center gap-0.5 shrink-0">
                    {selected && (
                        <span
                            role="button"
                            onClick={handleClear}
                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={12} />
                        </span>
                    )}
                    <ChevronDown
                        size={14}
                        className={cn("text-muted-foreground transition-transform duration-200", open && "rotate-180")}
                    />
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className={cn(
                    "absolute z-50 w-full mt-1 rounded-xl border border-border bg-popover shadow-lg",
                    "animate-in fade-in-0 zoom-in-95 duration-100"
                )}>
                    {/* Search input */}
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by section, course, dept…"
                                className={cn(
                                    "w-full h-8 pl-8 pr-3 rounded-lg text-sm",
                                    "bg-muted border-0 outline-none",
                                    "placeholder:text-muted-foreground/60",
                                    "focus:ring-1 focus:ring-ring transition-all"
                                )}
                            />
                            {search && (
                                <button onClick={() => setSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X size={11} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-60 overflow-y-auto p-1">
                        {sections.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No sections available
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No sections match "{search}"
                            </div>
                        ) : filtered.map((s) => {
                            const isSelected = s.id === value;
                            const dept = s.course?.program?.department?.name;
                            const program = s.course?.program?.name;
                            const course = s.course?.name;

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleSelect(s.id)}
                                    className={cn(
                                        "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                        "hover:bg-accent",
                                        isSelected && "bg-accent"
                                    )}
                                >
                                    {/* Check or spacer */}
                                    <span className="mt-0.5 shrink-0">
                                        {isSelected
                                            ? <Check size={13} className="text-primary" />
                                            : <span className="w-[13px] block" />
                                        }
                                    </span>

                                    <span className="flex-1 min-w-0 space-y-0.5">
                                        {/* Row 1: section name + badges */}
                                        <span className="flex items-center gap-2 flex-wrap">
                                            <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                                                {s.name}
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                Sem {s.semester}
                                            </span>
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                {s.batch}
                                            </span>
                                            {s.room_no && (
                                                <span className="text-[10px] text-muted-foreground">Room {s.room_no}</span>
                                            )}
                                        </span>

                                        {/* Row 2: hierarchy breadcrumb */}
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                                            {dept && <><span>{dept}</span><span className="opacity-40">›</span></>}
                                            {program && <><span>{program}</span><span className="opacity-40">›</span></>}
                                            {course && <span>{course}</span>}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer: result count */}
                    {search && (
                        <div className="px-3 py-2 border-t border-border text-[11px] text-muted-foreground">
                            {filtered.length} of {sections.length} sections
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}