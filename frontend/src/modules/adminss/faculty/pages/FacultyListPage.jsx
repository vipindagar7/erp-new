// src/modules/faculty/pages/FacultyListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Eye, Edit2, ShieldOff, Shield, PowerOff, Power, Trash2 } from "lucide-react";
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

export default function FacultyListPage({ status: statusProp }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can, isSuperAdmin, isRoot } = usePageGuard();

  const [faculty,  setFaculty]  = useState([]);
  const [depts,    setDepts]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [query,    setQuery]    = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [status,   setStatus]   = useState(statusProp || searchParams.get("status") || "");
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState(null);
  const [acting,   setActing]   = useState(false);
  const limit = 20;
  const timer = useRef(null);

  const load = async (overrides = {}) => {
    setLoading(true);
    try {
      const p = { page, limit, ...overrides };
      if (query)      p.search  = query;
      if (deptFilter) p.dept_id = deptFilter;
      if (status)     p.status  = status;
      const r = await axiosInstance.get(EP.faculty.list, { params: p });
      const d = r.data?.data;
      setFaculty(d?.faculty || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    axiosInstance.get(EP.departments.list, { params: { limit: 200 } })
      .then((r) => setDepts(Array.isArray(r.data?.data) ? r.data.data : []));
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); load({ page: 1 }); }, 300);
  }, [query, deptFilter, status]);

  useEffect(() => { load(); }, [page]);

  const getStatus = (f) => {
    if (f.deleted_at) return "INACTIVE";
    if (f.user?.isBlocked) return "BLOCKED";
    return "ACTIVE";
  };

  const confirm = async () => {
    setActing(true);
    try {
      const { type, item } = modal;
      const base = EP.faculty.byId(item.id);
      if (type === "block")      await axiosInstance.post(`${base}/block`, { reason: "" });
      if (type === "unblock")    await axiosInstance.post(`${base}/unblock`);
      if (type === "deactivate") await axiosInstance.post(`${base}/deactivate`);
      if (type === "restore")    await axiosInstance.post(`${base}/restore`);
      if (type === "delete")     await axiosInstance.delete(EP.faculty.delete(item.id));
      notify.success(type === "block" ? "Blocked" : type === "unblock" ? "Unblocked" : type === "deactivate" ? "Deactivated" : type === "restore" ? "Restored" : "Deleted");
      setModal(null);
      load({ page: 1 });
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-bold">{status ? `${status.charAt(0)+status.slice(1).toLowerCase()} Faculty` : "All Faculty"}</h1><p className="text-sm text-muted-foreground">{total} members</p></div>
        {(isSuperAdmin || can("faculty.create")) && <Button size="sm" onClick={() => navigate(ROUTES.faculty.new)}><Plus size={14} className="mr-1" /> Add Faculty</Button>}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <SearchBar value={query} onChange={setQuery} placeholder="Search name, emp ID, email…" className="flex-1 min-w-[200px] max-w-sm" />
        <FilterPanel filters={[
          { key: "dept", label: "Department", type: "select", value: deptFilter,
            onChange: (v) => { setDeptFilter(v); setPage(1); },
            options: depts.map((d) => ({ value: d.id, label: d.name })) },
          { key: "status", label: "Status", type: "select", value: status,
            onChange: (v) => { setStatus(v); setPage(1); },
            options: [{ value: "ACTIVE", label: "Active" }, { value: "BLOCKED", label: "Blocked" }, { value: "INACTIVE", label: "Inactive" }] },
        ]} />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Name","Emp ID","Department","Designation","Status","Subjects","Sections",""].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_,i) => <SkeletonRow key={i} cols={8} />)
            : faculty.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No faculty found</td></tr>
            : faculty.map((f) => {
              const st = getStatus(f);
              return (
                <tr key={f.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.faculty.detail(f.id))}>
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.user?.email}</p>
                  </td>
                  <td className="px-4 py-3.5"><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{f.emp_id || "—"}</span></td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{f.department?.name || "—"}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{f.designation || "—"}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={st} /></td>
                  <td className="px-4 py-3.5 text-muted-foreground">{f._count?.subjects ?? 0}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{f._count?.coordinating_sections ?? 0}</td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => navigate(ROUTES.faculty.detail(f.id))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={14} /></button>
                      {(isSuperAdmin || can("faculty.update")) && <button onClick={() => navigate(ROUTES.faculty.edit(f.id))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={14} /></button>}
                      {isSuperAdmin && (
                        st === "BLOCKED"
                          ? <button onClick={() => setModal({ type: "unblock", item: f })} className="p-1.5 rounded-lg hover:bg-muted text-green-600" title="Unblock"><Shield size={14} /></button>
                          : <button onClick={() => setModal({ type: "block", item: f })} className="p-1.5 rounded-lg hover:bg-muted text-amber-600" title="Block"><ShieldOff size={14} /></button>
                      )}
                      {isSuperAdmin && (
                        f.deleted_at
                          ? <button onClick={() => setModal({ type: "restore", item: f })} className="p-1.5 rounded-lg hover:bg-muted text-green-600" title="Restore"><Power size={14} /></button>
                          : <button onClick={() => setModal({ type: "deactivate", item: f })} className="p-1.5 rounded-lg hover:bg-muted text-amber-600" title="Deactivate"><PowerOff size={14} /></button>
                      )}
                      {isRoot && (f._count?.subjects ?? 0) === 0 && (f._count?.coordinating_sections ?? 0) === 0 && (
                        <button onClick={() => setModal({ type: "delete", item: f })} className="p-1.5 rounded-lg hover:bg-muted text-destructive"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} />

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={modal?.type === "block" ? "Block Faculty" : modal?.type === "unblock" ? "Unblock Faculty" : modal?.type === "deactivate" ? "Deactivate Faculty" : modal?.type === "restore" ? "Restore Faculty" : "Delete Faculty"}
        description={`${modal?.type === "block" ? "Block" : modal?.type === "unblock" ? "Unblock" : modal?.type === "deactivate" ? "Deactivate" : modal?.type === "restore" ? "Restore" : "Delete"} "${modal?.item?.name}"?`}
        confirmLabel={modal?.type === "unblock" ? "Unblock" : modal?.type === "restore" ? "Restore" : modal?.type === "block" ? "Block" : modal?.type === "deactivate" ? "Deactivate" : "Delete"}
        variant={modal?.type === "delete" || modal?.type === "block" || modal?.type === "deactivate" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}
