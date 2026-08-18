// src/modules/department/pages/DepartmentsPage.jsx
// Dept CRUD + permission-filtered actions
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments, createDepartment, updateDepartment } from "../../../../redux/academic/academicSlice.js";
import { notify } from "../../../../hooks/notify.js";
import { Building2, Plus, Edit, Trash2, Users, GraduationCap, X, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { CanDo } from "../../../../components/shared/PermGuard.jsx";

function DeptModal({ dept, onClose, onSave }) {
  const dispatch = useDispatch();
  const [name,    setName]    = useState(dept?.name    || "");
  const [code,    setCode]    = useState(dept?.code    || "");
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    if (!name.trim()) return notify.error("Name required");
    setSaving(true);
    try {
      if (dept?.id) await dispatch(updateDepartment({ id: dept.id, data:{ name: name.trim(), code: code.trim()||undefined } })).unwrap();
      else          await dispatch(createDepartment({ name: name.trim(), code: code.trim()||undefined })).unwrap();
      notify.success(dept?.id ? "Updated" : "Created");
      onSave();
    } catch(e) { notify.error(e?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{dept?.id ? "Edit Department" : "Add Department"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={14}/></button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Department Name *</label>
            <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              value={name} onChange={e => setName(e.target.value)} placeholder="Computer Science"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Code</label>
            <input className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              value={code} onChange={e => setCode(e.target.value)} placeholder="CSE"/>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-9 rounded-xl border border-border text-sm hover:bg-muted">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()}
            className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={13} className="animate-spin"/>}Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const dispatch = useDispatch();
  const { list: depts, loading, actionLoading } = useSelector(s => s.academic?.departments || { list:[], loading:false, actionLoading:false });
  const [modal,  setModal]  = useState(null); // null | dept | "new"
  const [stats,  setStats]  = useState({});

  useEffect(() => {
    if (!depts.length) dispatch(fetchDepartments({ limit: 200 }));
  }, []);

  // Load dept stats
  useEffect(() => {
    if (!depts.length) return;
    axiosInstance.get("/api/departments/stats").then(r => {
      const data = r.data?.data || {};
      setStats(data);
    }).catch(() => {});
  }, [depts.length]);

  const deleteDept = async (id) => {
    if (!confirm("Delete this department? This cannot be undone.")) return;
    try {
      await axiosInstance.delete(EP.departments?.delete?.(id) || `/api/departments/${id}`);
      notify.success("Deleted");
      dispatch(fetchDepartments({ limit: 200 }));
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 size={18} className="text-primary"/>Departments
          </h1>
          <p className="text-sm text-muted-foreground">{depts.length} departments</p>
        </div>
        <CanDo perm="departments.create">
          <button onClick={() => setModal("new")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus size={14}/>Add Department
          </button>
        </CanDo>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(dept => {
            const s = stats[dept.id] || {};
            return (
              <div key={dept.id} className="bg-card border border-border rounded-2xl p-4 space-y-3 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{dept.name}</p>
                    {dept.code && <p className="text-xs text-muted-foreground font-mono">{dept.code}</p>}
                  </div>
                  <div className="flex gap-1">
                    <CanDo perm="departments.update">
                      <button onClick={() => setModal(dept)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                        <Edit size={13}/>
                      </button>
                    </CanDo>
                    <CanDo perm="departments.delete">
                      <button onClick={() => deleteDept(dept.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500">
                        <Trash2 size={13}/>
                      </button>
                    </CanDo>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={11}/>{s.students || 0} students</span>
                  <span className="flex items-center gap-1"><GraduationCap size={11}/>{s.faculty || 0} faculty</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <DeptModal
          dept={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); dispatch(fetchDepartments({ limit: 200 })); }}
        />
      )}
    </div>
  );
}