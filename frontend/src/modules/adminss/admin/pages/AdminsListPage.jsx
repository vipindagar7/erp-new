// src/modules/admin/pages/AdminsListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Eye, Edit2, ShieldOff, Shield, Trash2, ArrowUp, Key } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { notify } from "../../../../hooks/notify.js";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import { SearchBar }   from "../../../../components/shared/SearchBar.jsx";
import { FilterPanel } from "../../../../components/shared/FilterPanel.jsx";
import { Pagination }  from "../../../../components/shared/Pagination.jsx";
import { SkeletonRow } from "../../../../components/shared/Skeleton.jsx";
import StatusBadge     from "../../../../components/shared/StatusBadge.jsx";
import { Button } from "@/components/ui/button";

export default function AdminsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSuperAdmin, isRoot } = usePageGuard();

  const [admins,  setAdmins]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [query,   setQuery]   = useState("");
  const [status,  setStatus]  = useState(searchParams.get("status") || "");
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);
  const limit = 20;
  const timer = useRef(null);

  const load = async (overrides = {}) => {
    setLoading(true);
    try {
      const p = { page, limit, ...overrides };
      if (query)  p.search = query;
      if (status) p.status = status;
      const r = await axiosInstance.get(EP.admins.list, { params: p });
      const d = r.data?.data;
      setAdmins(d?.admins || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load admins"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); load({ page: 1 }); }, 300);
  }, [query, status]);

  useEffect(() => { load(); }, [page]);

  const confirm = async () => {
    setActing(true);
    try {
      const { type, admin } = modal;
      if (type === "block")      await axiosInstance.post(`${EP.admins.byId(admin.id)}/block`, { reason: "" });
      if (type === "unblock")    await axiosInstance.post(`${EP.admins.byId(admin.id)}/unblock`);
      if (type === "deactivate") await axiosInstance.post(`${EP.admins.byId(admin.id)}/deactivate`);
      if (type === "promote")    await axiosInstance.post(`${EP.admins.byId(admin.id)}/promote`);
      if (type === "delete")     await axiosInstance.delete(EP.admins.delete(admin.id));
      notify.success(
        type === "block" ? "Blocked" : type === "unblock" ? "Unblocked" :
        type === "deactivate" ? "Deactivated" : type === "promote" ? "Promoted to Super Admin" : "Deleted"
      );
      setModal(null);
      load({ page: 1 });
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold">All Admins</h1><p className="text-sm text-muted-foreground">{total} accounts</p></div>
        {isSuperAdmin && <Button size="sm" onClick={() => navigate(ROUTES.admins.new)}><Plus size={14} className="mr-1" /> Add Admin</Button>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name or email…" className="flex-1 min-w-[200px] max-w-sm" />
        <FilterPanel filters={[{
          key: "status", label: "Status", type: "select", value: status,
          onChange: (v) => { setStatus(v); setPage(1); },
          options: [{ value: "active", label: "Active" }, { value: "blocked", label: "Blocked" }],
        }]} />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Name","Email","Status","First Login","Logs","Created",""].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_,i) => <SkeletonRow key={i} cols={7} />)
            : admins.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No admins found</td></tr>
            : admins.map((a) => (
              <tr key={a.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.admins.detail(a.id))}>
                <td className="px-4 py-3.5 font-medium">{a.admin?.name || "—"}</td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3.5"><StatusBadge status={a.isBlocked ? "BLOCKED" : "ACTIVE"} /></td>
                <td className="px-4 py-3.5"><StatusBadge status={a.first_login_completed ? "ACTIVE" : "PENDING"} label={a.first_login_completed ? "Done" : "Pending"} size="xs" /></td>
                <td className="px-4 py-3.5 text-muted-foreground">{a._count?.auditLogs ?? 0}</td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => navigate(ROUTES.admins.detail(a.id))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={14} /></button>
                    {isSuperAdmin && (
                      <>
                        <button onClick={() => navigate(ROUTES.admins.edit(a.id))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={14} /></button>
                        {a.isBlocked
                          ? <button onClick={() => setModal({ type: "unblock", admin: a })} className="p-1.5 rounded-lg hover:bg-muted text-green-600"><Shield size={14} /></button>
                          : <button onClick={() => setModal({ type: "block", admin: a })} className="p-1.5 rounded-lg hover:bg-muted text-amber-600"><ShieldOff size={14} /></button>
                        }
                      </>
                    )}
                    {isRoot && (
                      <>
                        <button onClick={() => setModal({ type: "promote", admin: a })} className="p-1.5 rounded-lg hover:bg-muted text-blue-600" title="Promote to Super Admin"><ArrowUp size={14} /></button>
                        {(a._count?.auditLogs ?? 0) === 0 && (
                          <button onClick={() => setModal({ type: "delete", admin: a })} className="p-1.5 rounded-lg hover:bg-muted text-destructive"><Trash2 size={14} /></button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={
          modal?.type === "block"      ? "Block Admin" :
          modal?.type === "unblock"    ? "Unblock Admin" :
          modal?.type === "deactivate" ? "Deactivate Admin" :
          modal?.type === "promote"    ? "Promote to Super Admin" : "Delete Admin"
        }
        description={
          modal?.type === "block"      ? `Block "${modal?.admin?.admin?.name}"? They will be logged out immediately.` :
          modal?.type === "unblock"    ? `Unblock "${modal?.admin?.admin?.name}"?` :
          modal?.type === "deactivate" ? `Deactivate "${modal?.admin?.admin?.name}"?` :
          modal?.type === "promote"    ? `Promote "${modal?.admin?.admin?.name}" to Super Admin? They will gain full ERP access.` :
          `Permanently delete "${modal?.admin?.admin?.name}"? Cannot be undone.`
        }
        confirmLabel={modal?.type === "unblock" ? "Unblock" : modal?.type === "promote" ? "Promote" : modal?.type === "block" ? "Block" : modal?.type === "deactivate" ? "Deactivate" : "Delete"}
        variant={modal?.type === "delete" || modal?.type === "block" || modal?.type === "deactivate" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}
