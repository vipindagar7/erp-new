// src/modules/superadmin/pages/SuperAdminHubPage.jsx
// Root-only module for managing Super Admin accounts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Plus, Users, Shield, Activity, History } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { Button } from "@/components/ui/button";
import { notify } from "../../../../hooks/notify.js";

export default function SuperAdminHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [list,  setList]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.superadmin.list, { params: { limit: 50 } }).catch(() => ({ data: null })),
    ]).then(([r]) => {
      const d = r.data?.data;
      setList(d?.superadmins || []);
      setStats(d?.stats || { total: d?.pagination?.total });
    }).finally(() => setLoading(false));
  }, []);

  const blockUser = async (id, blocked) => {
    try {
      await axiosInstance.post(blocked ? EP.superadmin.unblock(id) : EP.superadmin.block(id));
      notify.success(blocked ? "Unblocked" : "Blocked");
      setList((l) => l.map((u) => u.id === id ? { ...u, user: { ...u.user, isBlocked: !blocked } } : u));
    } catch { notify.error("Failed"); }
  };

  const demote = async (id) => {
    if (!confirm("Demote this Super Admin to regular Admin?")) return;
    try {
      await axiosInstance.post(EP.superadmin.demote(id));
      notify.success("Demoted to Admin");
      setList((l) => l.filter((u) => u.id !== id));
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><Crown size={20} /></div>
          <div><h1 className="text-2xl font-bold">Super Admins</h1><p className="text-sm text-muted-foreground">Root-only management of Super Admin accounts</p></div>
        </div>
        <Button onClick={() => navigate(ROUTES.superadmin.new)}><Plus size={14} className="mr-1.5" /> Add Super Admin</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold mt-1">{stats?.total ?? list.length}</p></div>
        <div className="bg-card border border-border rounded-2xl p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold mt-1 text-green-600">{list.filter((u) => !u.user?.isBlocked).length}</p></div>
        <div className="bg-card border border-border rounded-2xl p-4"><p className="text-xs text-muted-foreground">Blocked</p><p className="text-2xl font-bold mt-1 text-red-600">{list.filter((u) => u.user?.isBlocked).length}</p></div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All Super Admins</p>
        </div>
        {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        : list.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No super admins yet</div>
        : <table className="w-full text-sm">
            <thead className="border-b border-border"><tr>{["Name","Emp ID","Department","Status",""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((sa) => (
                <tr key={sa.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{sa.name}</p>
                    <p className="text-xs text-muted-foreground">{sa.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{sa.emp_id || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{sa.department?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${sa.user?.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {sa.user?.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.superadmin.detail(sa.id))}>View</Button>
                      <Button variant="outline" size="sm" onClick={() => blockUser(sa.id, sa.user?.isBlocked)}>
                        {sa.user?.isBlocked ? "Unblock" : "Block"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => demote(sa.id)}>Demote</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}