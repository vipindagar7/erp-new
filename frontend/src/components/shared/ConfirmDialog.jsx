// src/components/shared/ConfirmDialog.jsx
import { Loader2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open, onClose, onConfirm, loading = false,
  title = "Are you sure?", description, confirmLabel = "Confirm",
  variant = "default", children,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === "destructive" && (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        {(description || children) && (
          <div className="py-1 space-y-3">
            {description && (typeof description === "string"
              ? <p className="text-sm text-muted-foreground">{description}</p>
              : description)}
            {children}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export default ConfirmDialog;
