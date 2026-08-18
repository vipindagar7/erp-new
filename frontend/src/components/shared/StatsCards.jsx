// src/components/shared/StatsCards.jsx
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils.js";

const COLOR_MAP = {
  violet:"text-violet-600", blue:"text-blue-600", green:"text-green-600",
  amber:"text-amber-600",   red:"text-red-600",   teal:"text-teal-600",
  indigo:"text-indigo-600", gray:"text-gray-600", orange:"text-orange-600",
};

// cards = [{ label, value, color, path, icon: Icon, change, changeLabel }]
export function StatsCards({ cards = [], loading = false, cols, className }) {
  const navigate  = useNavigate();
  const gridCols  = cols || Math.min(cards.length, 4);
  return (
    <div className={cn(`grid gap-3 grid-cols-2 sm:grid-cols-${gridCols}`, className)}>
      {cards.map(({ label, value, color = "violet", path, icon: Icon }) => (
        <button key={label}
          onClick={() => path && navigate(path)}
          className={cn("bg-card border border-border rounded-2xl p-5 text-left transition-all",
            path && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer")}>
          <div className="flex items-start justify-between">
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            {Icon && (
              <div className={cn("w-8 h-8 rounded-xl bg-muted flex items-center justify-center", COLOR_MAP[color])}>
                <Icon size={15} />
              </div>
            )}
          </div>
          <p className={cn("text-3xl font-bold mt-2", COLOR_MAP[color])}>
            {loading ? <Loader2 size={20} className="animate-spin inline" /> : (value ?? "—")}
          </p>
        </button>
      ))}
    </div>
  );
}
export default StatsCards;
