// src/modules/groups/pages/GroupListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, MoreVertical, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { SkeletonRow } from "../../../../components/shared/Skeleton.jsx";
import { Pagination }  from "../../../../components/shared/Pagination.jsx";
import StatusBadge     from "../../../../components/shared/StatusBadge.jsx";
import { Button }      from "@/components/ui/button";
import { Input }       from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelector } from "react-redux";

const GROUP_TYPES = ["EVENT","FEST","SPORTS","COMMITTEE","CLUB","OTHER"];

const TYPE_COLORS = {
  EVENT: "blue", FEST: "purple", SPORTS: "green",
  COMMITTEE: "amber", CLUB: "pink", OTHER: "gray",
};

export default function GroupListPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const isRoot = user?.is_root;
  const isSA   = user?.role === "SUPER_ADMIN" || isRoot;

  const [groups,  setGroups]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState("");
  const [type,    setType]    = useState("");
  const [active,  setActive]  = useState("");
  const [page,    setPage]    = useState(1);
  const [openMenu,setOpenMenu]= useState(null);
  const limit = 20;
  const timer = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = { page, limit };
      if (search)    p.search    = search;
      if (type)      p.type      = type;
      if (active)    p.is_active = active;
      const r = await axiosInstance.get(EP.groups.list, { params: p });
      const d = r.data?.data;
      setGroups(d?.groups || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => { setPage(1); load(); }, 250); }, [search, type, active]);
  useEffect(() => { load(); }, [page]);

  const deactivate = async (id) => {
    try { await axiosInstance.post(`${EP.groups.byId(id)}/deactivate`); notify.success("Deactivated"); load(); }
    catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setOpenMenu(null); }
  };

  const restore = async (id) => {
    try { await axiosInstance.post(`${EP.groups.byId(id)}/restore`); notify.success("Restored"); load(); }
    catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setOpenMenu(null); }
  };

  const del = async (id, name) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try { await axiosInstance.delete(EP.groups.delete(id)); notify.success("Deleted"); load(); }
    catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setOpenMenu(null); }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">All Groups</h1><p className="text-sm text-muted-foreground">{total} groups</p></div>
        {isSA && <Button onClick={() => navigate(ROUTES.groups.new)}><Plus size={14} className="mr-1.5" /> New Group</Button>}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Search groups…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="h-9 w-56 text-sm" />
        <Select value={type || "all"} onValueChange={(v) => { setType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {GROUP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={active || "all"} onValueChange={(v) => { setActive(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="h-9 w-32 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Name","Type","Members","Announcements","Tasks","Status",""].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(6).fill(0).map((_,i) => <SkeletonRow key={i} cols={7} />)
            : groups.length === 0
              ? <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No groups found</td></tr>
              : groups.map((g) => (
                <tr key={g.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.groups.detail(g.id))}>
                  <td className="px-4 py-3.5">
                    <p className="font-medium">{g.name}</p>
                    {g.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{g.description}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium bg-${TYPE_COLORS[g.type] || "gray"}-100 text-${TYPE_COLORS[g.type] || "gray"}-700 px-2 py-0.5 rounded-full`}>{g.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-medium">{g._count?.members ?? 0}</td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">{g._count?.announcements ?? 0}</td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground">{g._count?.tasks ?? 0}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {g.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 relative">
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === g.id ? null : g.id); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                      <MoreVertical size={14} />
                    </button>
                    {openMenu === g.id && (
                      <div className="absolute right-4 top-10 z-50 bg-card border border-border rounded-xl shadow-lg py-1 w-40" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(ROUTES.groups.detail(g.id))} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                          <Eye size={13} /> View
                        </button>
                        {isSA && (g.is_active
                          ? <button onClick={() => deactivate(g.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-amber-600"><PauseCircle size={13} /> Deactivate</button>
                          : <button onClick={() => restore(g.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-green-600"><PlayCircle size={13} /> Restore</button>
                        )}
                        {isRoot && <button onClick={() => del(g.id, g.name)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-destructive"><Trash2 size={13} /> Delete</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
    </div>
  );
}