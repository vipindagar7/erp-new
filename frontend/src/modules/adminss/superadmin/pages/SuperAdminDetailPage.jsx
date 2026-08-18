// src/modules/admin/pages/SuperAdminDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, ShieldOff, Shield, Trash2, RotateCcw, Activity, Key } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import { SkeletonPage }  from "../../../../components/shared/Skeleton.jsx";
import StatusBadge       from "../../../../components/shared/StatusBadge.jsx";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return <div className="space-y-0.5"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>;
}

export default function SuperAdminDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useSelector((s) => s.auth);

  const [sa,      setSa]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const load = async () => {
    try { const r = await axiosInstance.get(EP.superadmin.byId(id)); setSa(r.data?.data); }
    catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    setActing(true);
    try {
      if (modal === "block")    await axiosInstance.post(EP.superadmin.block(id), { reason: "" });
      if (modal === "unblock")  await axiosInstance.post(EP.superadmin.unblock(id));
      if (modal === "demote")   await axiosInstance.post(EP.superadmin.demote(id));
      if (modal === "resetpwd") { const r = await axiosInstance.post(`${EP.superadmin.byId(id)}/reset-password`); notify.success(`Password reset. Temp: ${r.data?.data?.tempPassword}`); setModal(null); return; }
      if (modal === "delete")   { await axiosInstance.delete(EP.superadmin.delete(id)); notify.success("Deleted"); return navigate(`${ROUTES.system.superAdmins}/list`); }
      notify.success("Done");
      setModal(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  if (loading) return <SkeletonPage />;
  if (!sa) return <div className="text-center py-20 text-muted-foreground">Not found.<br /><button onClick={() => navigate(`${ROUTES.system.superAdmins}/list`)} className="text-primary text-sm mt-2 hover:underline">← Back</button></div>;

  const canAct = me?.is_root && !sa.is_root;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`${ROUTES.system.superAdmins}/list`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{sa.admin?.name}</h1>
              {sa.is_root && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">ROOT</span>}
              <StatusBadge status={sa.isBlocked ? "BLOCKED" : "ACTIVE"} />
            </div>
            <p className="text-sm text-muted-foreground">{sa.email}</p>
          </div>
        </div>
        {canAct && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate(`${ROUTES.system.superAdmins}/${id}/activity`)}><Activity size={13} className="mr-1" /> Activity</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`${ROUTES.system.superAdmins}/${id}/edit`)}><Edit2 size={13} className="mr-1" /> Edit</Button>
            <Button variant="outline" size="sm" onClick={() => setModal("resetpwd")}><Key size={13} className="mr-1" /> Reset Password</Button>
            {sa.isBlocked
              ? <Button size="sm" onClick={() => setModal("unblock")}><Shield size={13} className="mr-1" /> Unblock</Button>
              : <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => setModal("block")}><ShieldOff size={13} className="mr-1" /> Block</Button>
            }
            <Button variant="outline" size="sm" className="text-blue-600" onClick={() => setModal("demote")}><RotateCcw size={13} className="mr-1" /> Demote</Button>
            {(sa._count?.auditLogs ?? 0) === 0 && (
              <Button variant="destructive" size="sm" onClick={() => setModal("delete")}><Trash2 size={13} className="mr-1" /> Delete</Button>
            )}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Account Details</p>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Name"          value={sa.admin?.name} />
          <InfoRow label="Email"         value={sa.email} />
          <InfoRow label="Role"          value={sa.is_root ? "Root + Super Admin" : "Super Admin"} />
          <InfoRow label="First Login"   value={sa.first_login_completed ? "Completed" : "Pending"} />
          <InfoRow label="Created"       value={new Date(sa.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} />
          <InfoRow label="Last Updated"  value={new Date(sa.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Active Sessions", value: sa._count?.userSessions, color: "blue" }, { label: "Audit Logs", value: sa._count?.auditLogs, color: "violet" }].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {sa.loginHistory?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Logins</p></div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>{["Status","IP","Browser","OS","When"].map((h)=>(<th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>))}</tr></thead>
            <tbody className="divide-y divide-border">
              {sa.loginHistory.map((l, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5"><StatusBadge status={l.status === "SUCCESS" ? "ACTIVE" : "BLOCKED"} label={l.status} size="xs" /></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.ip_address || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.browser    || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.os         || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={modal === "block" ? "Block Account" : modal === "unblock" ? "Unblock Account" : modal === "demote" ? "Demote to Admin" : modal === "resetpwd" ? "Reset Password" : "Delete Account"}
        description={
          modal === "block"    ? `Block "${sa.admin?.name}"? All their sessions will be revoked immediately.` :
          modal === "unblock"  ? `Unblock "${sa.admin?.name}"? They will regain full Super Admin access.` :
          modal === "demote"   ? `Demote "${sa.admin?.name}" to Admin? They will lose Super Admin privileges.` :
          modal === "resetpwd" ? `Reset password for "${sa.admin?.name}"? A new temporary password will be generated.` :
          `Permanently delete "${sa.admin?.name}"? This cannot be undone.`
        }
        confirmLabel={modal === "block" ? "Block" : modal === "unblock" ? "Unblock" : modal === "demote" ? "Demote" : modal === "resetpwd" ? "Reset" : "Delete"}
        variant={modal === "block" || modal === "delete" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}
