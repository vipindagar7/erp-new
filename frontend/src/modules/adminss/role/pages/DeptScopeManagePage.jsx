// src/modules/adminss/roles/pages/DeptScopeManagePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Plus, Trash2, Loader2, Search, ChevronRight, Check } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const ALL_MODULES = ["students","faculty","attendance","marks","timetable","exam","fee","hr","assignment","training","skillcard","leave","curriculum","enrollment","department","reports"];

export default function DeptScopeManagePage() {
  const navigate = useNavigate();
  const [scopes,  setScopes]  = useState([]);
  const [depts,   setDepts]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [form, setForm] = useState({ user_id:"", dept_id:"", role:"DEPT_ADMIN", modules:[] });
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");

  const load = () => {
    Promise.all([
      axiosInstance.get(EP.deptScope.list),
      axiosInstance.get(EP.departments.list + "?limit=100"),
      axiosInstance.get(EP.admins.list + "?limit=200").catch(() => ({ data:{ data:[] } })),
    ]).then(([sRes, dRes, uRes]) => {
      setScopes(sRes.data?.data || []);
      setDepts(dRes.data?.data?.departments || dRes.data?.data || []);
      setUsers(uRes.data?.data?.admins || uRes.data?.data || []);
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const grant = async () => {
    if (!form.user_id || !form.dept_id) { notify.error("Select user and department"); return; }
    setSaving(true);
    try {
      await axiosInstance.post(EP.deptScope.grant, form);
      notify.success("Scope granted");
      setShowForm(false);
      setForm({ user_id:"", dept_id:"", role:"DEPT_ADMIN", modules:[] });
      load();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const revoke = async (user_id, dept_id, name) => {
    if (!confirm(`Revoke dept access for ${name}?`)) return;
    try {
      await axiosInstance.delete(EP.deptScope.revoke, { data: { user_id, dept_id } });
      notify.success("Scope revoked");
      load();
    } catch { notify.error("Failed"); }
  };

  const toggleModule = (m) => setForm(f => ({...f, modules: f.modules.includes(m) ? f.modules.filter(x=>x!==m) : [...f.modules,m]}));

  const filtered = scopes.filter(s =>
    !search ||
    s.user_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.dept?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} className="text-primary"/>Department Scope Management
          </h1>
          <p className="text-sm text-muted-foreground">Grant/revoke department-level access to admin users</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus size={14}/>Grant Access
        </button>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by user or department…"
          className="w-full h-10 pl-8 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No dept scopes configured yet</div>
            )}
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.user_id}</p>
                  <p className="text-xs text-muted-foreground">
                    Dept: {s.dept?.name} · Role: {s.role} ·
                    Modules: {s.modules?.length ? s.modules.join(", ") : "All"}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.is_active?"bg-green-50 text-green-700 border-green-200":"bg-muted text-muted-foreground border-border"}`}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
                <button onClick={() => revoke(s.user_id, s.dept_id, s.user_id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grant modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Grant Department Scope</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">User *</label>
                <select value={form.user_id} onChange={e => setForm(f=>({...f,user_id:e.target.value}))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                  <option value="">Select user…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Department *</label>
                <select value={form.dept_id} onChange={e => setForm(f=>({...f,dept_id:e.target.value}))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                  <option value="">Select department…</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Role</label>
                <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                  <option value="DEPT_ADMIN">Dept Admin</option>
                  <option value="MODULE_HEAD">Module Head</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Module Access <span className="text-muted-foreground font-normal">(empty = all modules)</span></label>
                <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                  {ALL_MODULES.map(m => {
                    const sel = form.modules.includes(m);
                    return (
                      <button key={m} onClick={() => toggleModule(m)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all
                          ${sel?"border-primary bg-primary/5 text-primary":"border-border hover:bg-muted/30"}`}>
                        <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${sel?"bg-primary border-primary":"border-input"}`}>
                          {sel && <Check size={7} className="text-primary-foreground"/>}
                        </div>
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={grant} disabled={saving}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                {saving ? "Granting…" : "Grant Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
