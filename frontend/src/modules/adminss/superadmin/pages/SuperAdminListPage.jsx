// src/modules/admin/pages/SuperAdminListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Eye, Edit2, ShieldOff, Shield, Trash2, RotateCcw } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog.jsx";
import { SearchBar }     from "../../../../components/shared/SearchBar.jsx";
import { FilterPanel }   from "../../../../components/shared/FilterPanel.jsx";
import { Pagination }    from "../../../../components/shared/Pagination.jsx";
import { SkeletonRow }   from "../../../../components/shared/Skeleton.jsx";
import StatusBadge       from "../../../../components/shared/StatusBadge.jsx";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";

export default function SuperAdminListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((s) => s.auth);
  const isRoot = user?.is_root;

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
      const r = await axiosInstance.get(EP.superadmin.list, { params: p });
      const d = r.data?.data;
      setAdmins(d?.superAdmins || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load"); }
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
      const { type, admin: sa } = modal;
      if (type === "block")   await axiosInstance.post(EP.superadmin.block(sa.id), { reason: "" });
      if (type === "unblock") await axiosInstance.post(EP.superadmin.unblock(sa.id));
      if (type === "demote")  await axiosInstance.post(EP.superadmin.demote(sa.id));
      if (type === "delete")  await axiosInstance.delete(EP.superadmin.delete(sa.id));
      notify.success(type === "block" ? "Blocked" : type === "unblock" ? "Unblocked" : type === "demote" ? "Demoted to Admin" : "Deleted");
      setModal(null);
      load({ page: 1 });
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Super Admins</h1>
          <p className="text-sm text-muted-foreground">{total} accounts</p>
        </div>
        {isRoot && (
          <Button size="sm" onClick={() => navigate(`${ROUTES.system.superAdmins}/new`)}>
            <Plus size={14} className="mr-1" /> Add Super Admin
          </Button>
        )}
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
            <tr>
              {["Name", "Email", "Status", "First Login", "Sessions", "Logs", "Created", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={8} />)
              : admins.length === 0
              ? <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No super admins found</td></tr>
              : admins.map((sa) => (
                <tr key={sa.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`${ROUTES.system.superAdmins}/${sa.id}`)}>
                  <td className="px-4 py-3.5 font-medium">{sa.admin?.name || "—"}{sa.is_root && <span className="ml-1.5 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold">ROOT</span>}</td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">{sa.email}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={sa.isBlocked ? "BLOCKED" : "ACTIVE"} /></td>
                  <td className="px-4 py-3.5"><StatusBadge status={sa.first_login_completed ? "ACTIVE" : "PENDING"} label={sa.first_login_completed ? "Done" : "Pending"} /></td>
                  <td className="px-4 py-3.5 text-muted-foreground">{sa._count?.userSessions ?? 0}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{sa._count?.auditLogs ?? 0}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{new Date(sa.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(`${ROUTES.system.superAdmins}/${sa.id}`)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={14} /></button>
                      {!sa.is_root && isRoot && (
                        <>
                          <button onClick={() => navigate(`${ROUTES.system.superAdmins}/${sa.id}/edit`)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={14} /></button>
                          {sa.isBlocked
                            ? <button onClick={() => setModal({ type: "unblock", admin: sa })} className="p-1.5 rounded-lg hover:bg-muted text-green-600"><Shield size={14} /></button>
                            : <button onClick={() => setModal({ type: "block", admin: sa })} className="p-1.5 rounded-lg hover:bg-muted text-amber-600"><ShieldOff size={14} /></button>
                          }
                          <button onClick={() => setModal({ type: "demote", admin: sa })} className="p-1.5 rounded-lg hover:bg-muted text-blue-600" title="Demote to Admin"><RotateCcw size={14} /></button>
                          {(sa._count?.auditLogs ?? 0) === 0 && (
                            <button onClick={() => setModal({ type: "delete", admin: sa })} className="p-1.5 rounded-lg hover:bg-muted text-destructive"><Trash2 size={14} /></button>
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

      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={
          modal?.type === "block"   ? "Block Super Admin" :
          modal?.type === "unblock" ? "Unblock Super Admin" :
          modal?.type === "demote"  ? "Demote to Admin" : "Delete Super Admin"
        }
        description={
          modal?.type === "block"   ? `Block "${modal?.admin?.admin?.name}"? They will be logged out of all sessions immediately.` :
          modal?.type === "unblock" ? `Unblock "${modal?.admin?.admin?.name}"? They will regain full access.` :
          modal?.type === "demote"  ? `Demote "${modal?.admin?.admin?.name}" to Admin role? They will lose Super Admin privileges.` :
          `Permanently delete "${modal?.admin?.admin?.name}"? This cannot be undone.`
        }
        confirmLabel={modal?.type === "block" ? "Block" : modal?.type === "unblock" ? "Unblock" : modal?.type === "demote" ? "Demote" : "Delete"}
        variant={modal?.type === "delete" || modal?.type === "block" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}
