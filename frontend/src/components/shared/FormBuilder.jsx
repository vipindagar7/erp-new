// src/components/shared/FormBuilder.jsx
import { cn } from "../../lib/utils.js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FormField({ field, value, onChange, error }) {
  const { key, label, type = "text", required, placeholder, options = [], hint, readOnly } = field;
  const id = `ff-${key}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {type === "select" ? (
        <Select value={value || ""} onValueChange={onChange} disabled={readOnly}>
          <SelectTrigger id={id} className={cn("h-9", error && "border-destructive")}>
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <textarea id={id} value={value || ""} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} readOnly={readOnly} rows={3}
          className={cn("w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none", error && "border-destructive")} />
      ) : type === "toggle" ? (
        <button type="button" onClick={() => !readOnly && onChange(!value)}
          className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", value ? "bg-primary" : "bg-muted", readOnly && "opacity-60 cursor-not-allowed")}>
          <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", value ? "translate-x-6" : "translate-x-1")} />
        </button>
      ) : (
        <Input id={id} type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} readOnly={readOnly}
          className={cn("h-9", error && "border-destructive", readOnly && "bg-muted")} />
      )}
      {hint  && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function FormBuilder({ fields = [], values = {}, onChange, errors = {}, cols = 1, className }) {
  return (
    <div className={cn("grid gap-4", cols > 1 && `grid-cols-${cols}`, className)}>
      {fields.map((f) => (
        <FormField key={f.key} field={f} value={values[f.key]}
          onChange={(v) => onChange(f.key, v)} error={errors[f.key]} />
      ))}
    </div>
  );
}
export default FormBuilder;
