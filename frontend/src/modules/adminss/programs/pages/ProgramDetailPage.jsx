// src/modules/programs/pages/ProgramDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, PowerOff, Power, Trash2, History } from "lucide-react";
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

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, isSuperAdmin, isRoot } = usePageGuard();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const load = async () => {
    try { const r = await axiosInstance.get(EP.programs.byId(id)); setProgram(r.data?.data); }
    catch { notify.error("Failed to load program"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const confirm = async () => {
    setActing(true);
    try {
      if (modal === "deactivate") await axiosInstance.post(`${EP.programs.byId(id)}/deactivate`);
      if (modal === "restore")    await axiosInstance.post(EP.programs.restore(id));
      if (modal === "delete")   { await axiosInstance.delete(EP.programs.delete(id)); return navigate(ROUTES.programs.list); }
      notify.success(modal === "deactivate" ? "Program deactivated" : "Program restored");
      setModal(null); load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setActing(false); }
  };

  if (loading) return <SkeletonPage />;
  if (!program) return <div className="text-center py-20 text-muted-foreground"><p>Program not found.</p><button onClick={() => navigate(ROUTES.programs.list)} className="text-primary text-sm mt-2 hover:underline">← Back</button></div>;

  const isInactive = !!program.deleted_at;
  const isEmpty    = (program._count?.students ?? 0) === 0 && (program._count?.courses ?? 0) === 0;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.programs.list)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{program.name}</h1>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{program.code}</span>
              <StatusBadge status={isInactive ? "INACTIVE" : "ACTIVE"} />
            </div>
            <p className="text-sm text-muted-foreground">{program.department?.name}{program.branch ? ` · ${program.branch.name}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.programs.history)}><History size={13} className="mr-1" /> History</Button>
          {(isSuperAdmin || can("program:update")) && !isInactive && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.programs.edit(id))}><Edit2 size={13} className="mr-1" /> Edit</Button>
          )}
          {isSuperAdmin && (
            isInactive
              ? <Button size="sm" onClick={() => setModal("restore")}><Power size={13} className="mr-1" /> Restore</Button>
              : <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => setModal("deactivate")}><PowerOff size={13} className="mr-1" /> Deactivate</Button>
          )}
          {isRoot && !isInactive && isEmpty && (
            <Button variant="destructive" size="sm" onClick={() => setModal("delete")}><Trash2 size={13} className="mr-1" /> Delete</Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Details</p>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Program Name"   value={program.name} />
          <InfoRow label="Code"           value={program.code} />
          <InfoRow label="Department"     value={program.department?.name} />
          <InfoRow label="Branch"         value={program.branch?.name || "—"} />
          <InfoRow label="Max Semesters"  value={program.max_semesters} />
          <InfoRow label="Duration"       value={program.duration_years ? `${program.duration_years} years` : "—"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Students", value: program._count?.students, color: "blue" }, { label: "Courses", value: program._count?.courses, color: "teal" }].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value ?? 0}</p>
          </div>
        ))}
      </div>

      {program.sections?.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Sections</p></div>
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>{["Section", "Code", "Semester", "Batch", "Students", "Status"].map((h) => (<th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {program.sections.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.sections.detail(s.id))}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{s.code}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{s.semester}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.batch}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s._count?.students ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!modal} onClose={() => setModal(null)}
        title={modal === "deactivate" ? "Deactivate Program" : modal === "restore" ? "Restore Program" : "Delete Program"}
        description={modal === "deactivate" ? `Deactivate "${program.name}"?` : modal === "restore" ? `Restore "${program.name}"?` : `Permanently delete "${program.name}"?`}
        confirmLabel={modal === "restore" ? "Restore" : modal === "deactivate" ? "Deactivate" : "Delete Permanently"}
        variant={modal === "delete" || modal === "deactivate" ? "destructive" : "default"}
        onConfirm={confirm} loading={acting} />
    </div>
  );
}