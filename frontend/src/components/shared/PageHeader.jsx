// src/components/shared/PageHeader.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "../../lib/utils.js";

export function PageHeader({ title, description, backPath, actions, badge, className }) {
  const navigate = useNavigate();
  return (
    <div className={cn("flex items-start justify-between flex-wrap gap-4", className)}>
      <div className="flex items-start gap-3">
        {backPath && (
          <button
            onClick={() => backPath === -1 ? navigate(-1) : navigate(backPath)}
            className="mt-0.5 p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
export default PageHeader;
