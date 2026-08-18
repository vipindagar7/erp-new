// src/components/shared/Timeline.jsx
import { cn } from "../../lib/utils.js";
import { Clock } from "lucide-react";

const COLOR_CLASSES = {
  green:  "bg-green-100 text-green-600",
  red:    "bg-red-100 text-red-600",
  blue:   "bg-blue-100 text-blue-600",
  amber:  "bg-amber-100 text-amber-600",
  violet: "bg-violet-100 text-violet-600",
  teal:   "bg-teal-100 text-teal-600",
};

export function Timeline({ items = [], className }) {
  if (!items.length) return <p className="text-xs text-muted-foreground text-center py-8">No timeline entries</p>;
  return (
    <div className={cn("relative space-y-0", className)}>
      <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />
      {items.map((item, idx) => {
        const Icon = item.icon || Clock;
        return (
          <div key={item.id || idx} className="relative flex gap-4 pb-6 last:pb-0">
            <div className={cn("relative z-10 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center shrink-0",
              COLOR_CLASSES[item.color] || "bg-muted text-muted-foreground")}>
              <Icon size={14} />
            </div>
            <div className="flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.badge}
              </div>
              {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
              {item.at && <p className="text-xs text-muted-foreground mt-1">{new Date(item.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
              {item.extra && <div className="mt-2">{item.extra}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default Timeline;
