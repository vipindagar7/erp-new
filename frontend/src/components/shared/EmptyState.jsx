// src/components/shared/EmptyState.jsx
import { Inbox } from "lucide-react";
import { cn } from "../../lib/utils.js";

export function EmptyState({ icon: Icon = Inbox, title = "Nothing here yet", description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={24} className="text-muted-foreground opacity-50" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
export default EmptyState;
