// src/modules/admin/pages/AdminDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, ShieldOff, Shield, Trash2, ArrowUp, Activity, Key } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import { SkeletonPage }  from "../../../../components/shared/Skeleton.jsx";
import StatusBadge       from "../../../../components/shared/StatusBadge.jsx";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return <div className="space-y-0.5"><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div>;
}

export default function AdminDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isRoot } = usePageGuard();

  const [admin,   setAdmin]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const load = async () => {
    try { const r = await axiosInstance.get(EP.admins.byId(id)); setAdmin(r.data?.data); }
    catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    setActing(true);
    try {
      if (modal === "block")      await axiosInstance.post(`${EP.admins.byId(id)}/block`, { reason: "" });
      if (modal === "unblock")    await axiosInstance.post(`${EP.admins.byId(id)}/unblock`);
      if (modal === "deactivate") await axiosInstance.post(`${EP.admins.byId(id)}/deactivate`);
      if (modal === "promote")    await axiosInstance.post(`${EP.admins.byId(id)}/promote`);
      if (modal === "resetpwd") {
        const r = await axiosInstance.post(`${EP.admins.byId(id)}/reset-password`);
        notify.success(`Password reset. Temp: ${r.data?.data?.tempPassword}`);
        setModal(null); return;
      }
      if (modal === "delete") {
        await axiosInstance.delete(EP.admins.delete(id));
        notify.success("Deleted");
        return navigate(ROUTES.admins.list);
      }
      notify.success("Done");
      setModal(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  if (loading) return <SkeletonPage />;
  if (!admin)  return <div className="text-center py-20 text-muted-foreground">Not found.<br /><button onClick={() => navigate(ROUTES.admins.list)} className="text-primary text-sm mt-2 hover:underline">← Back</button></div>;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.admins.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{admin.admin?.name}</h1>
              <StatusBadge status={admin.isBlocked ? "BLOCKED" : "ACTIVE"} />
            </div>
            <p className="text-sm text-muted-foreground">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(`${ROUTES.admins.detail(id)}/activity`)}><Activity size={13} className="mr-1" /> Activity</Button>
          {isSuperAdmin && <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.admins.edit(id))}><Edit2 size={13} className="mr-1" /> Edit</Button>}
          {isSuperAdmin && <Button variant="outline" size="sm" onClick={() => setModal("resetpwd")}><Key size={13} className="mr-1" /> Reset Pwd</Button>}
          {isSuperAdmin && (admin.isBlocked
            ? <Button size="sm" onClick={() => setModal("unblock")}><Shield size={13} className="mr-1" /> Unblock</Button>
            : <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => setModal("block")}><ShieldOff size={13} className="mr-1" /> Block</Button>
          )}
          {isRoot && <Button variant="outline" size="sm" className="text-blue-600" onClick={() => setModal("promote")}><ArrowUp size={13} className="mr-1" /> Promote</Button>}
          {isRoot && (admin._count?.auditLogs ?? 0) === 0 && <Button variant="destructive" size="sm" onClick={() => setModal("delete")}><Trash2 size={13} className="mr-1" /> Delete</Button>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Account Details</p>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Name"         value={admin.admin?.name} />
          <InfoRow label="Email"        value={admin.email} />
          <InfoRow label="Role"         value="Admin" />
          <InfoRow label="First Login"  value={admin.first_login_completed ? "Completed" : "Pending"} />
          <InfoRow label="Created"      value={new Date(admin.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} />
          <InfoRow label="Last Updated" value={new Date(admin.updatedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Active Sessions", value: admin._count?.userSessions, color: "blue" }, { label: "Audit Logs", value: admin._count?.auditLogs, color: "violet" }].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {admin.loginHistory?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Logins</p></div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30"><tr>{["Status","IP","Browser","When"].map((h) => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {admin.loginHistory.map((l, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5"><StatusBadge status={l.status === "SUCCESS" ? "ACTIVE" : "BLOCKED"} label={l.status} size="xs" /></td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.ip_address || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.browser || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={modal === "block" ? "Block Admin" : modal === "unblock" ? "Unblock Admin" : modal === "deactivate" ? "Deactivate Admin" : modal === "promote" ? "Promote to Super Admin" : modal === "resetpwd" ? "Reset Password" : "Delete Admin"}
        description={
          modal === "block"      ? `Block "${admin.admin?.name}"? Sessions revoked immediately.` :
          modal === "unblock"    ? `Unblock "${admin.admin?.name}"?` :
          modal === "deactivate" ? `Deactivate "${admin.admin?.name}"?` :
          modal === "promote"    ? `Promote "${admin.admin?.name}" to Super Admin?` :
          modal === "resetpwd"   ? "Generate a new temporary password?" :
          `Permanently delete "${admin.admin?.name}"?`
        }
        confirmLabel={modal === "unblock" ? "Unblock" : modal === "promote" ? "Promote" : modal === "resetpwd" ? "Reset" : modal === "block" ? "Block" : modal === "deactivate" ? "Deactivate" : "Delete"}
        variant={modal === "delete" || modal === "block" || modal === "deactivate" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}
