// src/modules/admin/pages/SuperAdminManagementPage.jsx
// ROOT ONLY. Block/unblock/demote Super Admins, create new ones,
// promote existing users. Hidden entirely from non-root users
// (PageGuard / route guard should already enforce this).
import { useState, useEffect } from "react";
import { Crown, Plus, ShieldOff, ShieldCheck, ArrowDownCircle, Loader2, Lock } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ConfirmModal } from "../../../../components/shared/ConfirmModal.jsx";
import { notify } from "../../../../hooks/notify.js";

function CreateModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return notify.error("Name and email required");
    setLoading(true);
    try {
      await axiosInstance.post(EP.superAdmin.create, form);
      notify.success("Super Admin created — temporary password emailed");
      onSave();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
        <h2 className="text-base font-semibold flex items-center gap-2"><Crown size={16} className="text-amber-500" /> Create Super Admin</h2>
        <div className="space-y-3">
          <div className="space-y-1.5"><label className="text-xs font-medium">Name *</label><input className={inp} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium">Email *</label><input className={inp} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        </div>
        <p className="text-xs text-muted-foreground">A temporary password will be emailed. They'll be forced to set a new password, PIN, and 2FA on first login.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium text-muted-foreground hover:bg-muted">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminManagementPage() {
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [actionTarget, setActionTarget] = useState(null); // { user, action: "block"|"unblock"|"demote" }
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.superAdmin.list);
      setAdmins(r.data?.data || []);
    } catch { notify.error("Failed to load — root access required"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const { user, action } = actionTarget;
      const endpoint = EP.superAdmin[action](user.id);
      await axiosInstance.post(endpoint);
      notify.success(`${action === "block" ? "Blocked" : action === "unblock" ? "Unblocked" : "Demoted"}`);
      setActionTarget(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Crown size={20} className="text-amber-500" /> Super Admin Management</h1>
          <p className="text-sm text-muted-foreground">Root-only — block, unblock, demote Super Admins or create new ones</p>
        </div>
        <button onClick={() => setModal(true)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14} /> Create Super Admin
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Name", "Email", "Status", "Joined", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {a.isRoot && <Crown size={13} className="text-amber-500" />}
                      <span className="font-medium">{a.name || "—"}</span>
                      {a.isRoot && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">ROOT</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${a.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {a.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    {a.isRoot ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Lock size={10} /> Protected</span>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        {a.isBlocked ? (
                          <button onClick={() => setActionTarget({ user: a, action: "unblock" })}
                            className="h-7 px-2 rounded-lg hover:bg-green-50 text-xs text-green-700 flex items-center gap-1"><ShieldCheck size={12} /> Unblock</button>
                        ) : (
                          <button onClick={() => setActionTarget({ user: a, action: "block" })}
                            className="h-7 px-2 rounded-lg hover:bg-red-50 text-xs text-red-700 flex items-center gap-1"><ShieldOff size={12} /> Block</button>
                        )}
                        <button onClick={() => setActionTarget({ user: a, action: "demote" })}
                          className="h-7 px-2 rounded-lg hover:bg-muted text-xs text-muted-foreground flex items-center gap-1"><ArrowDownCircle size={12} /> Demote</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <CreateModal onSave={() => { setModal(false); load(); }} onClose={() => setModal(false)} />}
      <ConfirmModal open={!!actionTarget} title={`${actionTarget?.action === "block" ? "Block" : actionTarget?.action === "unblock" ? "Unblock" : "Demote"} Super Admin`}
        variant={actionTarget?.action === "block" || actionTarget?.action === "demote" ? "danger" : "default"}
        message={`${actionTarget?.action === "block" ? "Block" : actionTarget?.action === "unblock" ? "Unblock" : "Demote to Admin"} "${actionTarget?.user?.name || actionTarget?.user?.email}"?`}
        confirmLabel="Confirm" loading={actionLoading} onConfirm={handleAction} onClose={() => setActionTarget(null)} />
    </div>
  );
}
