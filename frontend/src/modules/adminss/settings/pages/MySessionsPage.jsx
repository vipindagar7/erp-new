// src/modules/settings/pages/MySessionsPage.jsx
// Shows the logged-in user's own active sessions across devices.
// Available to Faculty, Admin, Super Admin (anyone with 2FA requirement).
import { useState, useEffect } from "react";
import { Smartphone, Monitor, Tablet, MapPin, Clock, LogOut, Loader2, ShieldCheck } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

const DEVICE_ICON = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

export default function MySessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.auth.sessions);
      setSessions(r.data?.data || []);
    } catch { notify.error("Failed to load sessions"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await axiosInstance.delete(EP.auth.revokeSession(revokeTarget.id));
      notify.success("Session revoked"); setRevokeTarget(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setRevoking(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} /> Active Sessions</h1>
        <p className="text-sm text-muted-foreground">Devices currently signed in to your account. Revoke any you don't recognize.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">No active sessions</div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const Icon = DEVICE_ICON[s.device_type] || Monitor;
            return (
              <div key={s.id} className={`bg-card border rounded-2xl p-4 flex items-start gap-4 ${s.isCurrent ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.isCurrent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{s.browser} on {s.os}</p>
                    {s.isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">This device</span>}
                    {s.is_locked && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Locked</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin size={11} /> {s.location || s.ip_address || "Unknown"}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> Active {new Date(s.last_active_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
                {!s.isCurrent && (
                  <button onClick={() => setRevokeTarget(s)}
                    className="h-8 px-3 rounded-lg border border-input text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 flex items-center gap-1.5 shrink-0">
                    <LogOut size={12} /> Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal open={!!revokeTarget} title="Revoke Session" variant="danger"
        message={`Sign out from ${revokeTarget?.browser} on ${revokeTarget?.os}? That device will be logged out immediately.`}
        confirmLabel="Revoke" loading={revoking}
        onConfirm={handleRevoke} onClose={() => setRevokeTarget(null)} />
    </div>
  );
}
