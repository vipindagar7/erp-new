import { cn } from "../lib/utils.js"
import { Check } from "lucide-react";

/**
 * StepWizard — reusable shell
 * Props:
 *   steps:   [{ label, icon? }]
 *   current: number (0-based)
 *   children: the current step content
 */
export function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-between px-1 mb-6">
      {steps.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const pending = i > current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                done    && "bg-primary border-primary text-primary-foreground",
                active  && "bg-background border-primary text-primary ring-4 ring-primary/20",
                pending && "bg-muted border-border text-muted-foreground"
              )}>
                {done ? <Check size={14} /> : <span>{i + 1}</span>}
              </div>
              <span className={cn(
                "text-[10px] font-medium hidden sm:block text-center leading-tight max-w-[60px]",
                active  && "text-primary",
                done    && "text-primary/70",
                pending && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 transition-all duration-300",
                i < current ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Field wrapper */
export function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground leading-none">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Two-col grid */
export function Grid2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

/** Three-col grid */
export function Grid3({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{children}</div>;
}

/** Section header inside a step */
export function StepSection({ title }) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest shrink-0">{title}</p>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/** Review row */
export function ReviewRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium">{value}</span>
    </div>
  );
}
