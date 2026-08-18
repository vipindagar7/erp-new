// src/modules/student/pages/StudentStatusPage.jsx
// Reusable page for Active / Detained / Passed / Previous views
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Download, ArrowUpCircle } from "lucide-react";
import { getStudents, deleteStudent, toggleStudentBlock } from "../../../../redux/student/studentSlice.js";
import { fetchSections } from "../../../../redux/academic/academicSlice.js";
import { StudentTable } from "../components/StudentTable.jsx";
import { PromoteModal, ChangeSectionModal } from "../components/StudentModals.jsx";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { notify } from "../../../../hooks/notify.js";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";

// status: "ACTIVE" | "DETAINED" | "PASSED" | "previous"
export default function StudentStatusPage({ status, title, description, color = "blue" }) {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();
  const { items: students, pagination, loading } = useSelector((s) => s.student);
  const sections = useSelector((s) => s.academic?.sections?.list ?? []);

  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(20);
  const [checkedIds, setCheckedIds] = useState([]);
  const [promoteTarget, setPromoteTarget]           = useState(null);
  const [changeSectionTarget, setChangeSectionTarget] = useState(null);

  const totalPages = pagination?.totalPages || pagination?.pages || 1;

  const load = () => {
    const params = { page, limit };
    if (status === "previous") {
      params.is_current = false;
    } else {
      params.status = status;
    }
    dispatch(getStudents(params));
  };

  useEffect(() => { load(); }, [page, limit, status]);
  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 500 })); }, []);

  const handleToggleBlock = async (s) => {
    await dispatch(toggleStudentBlock({ id: s.id, isBlocked: !s.user?.isBlocked }));
    load();
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete ${s.first_name} ${s.last_name}?`)) return;
    const r = await dispatch(deleteStudent(s.id));
    if (!r.error) load();
    else notify.error(r.payload);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (status !== "previous") params.set("status", status);
      const res = await axiosInstance.get(
        `${EP.admins.reportStudents}?${params}`,
        { responseType: "blob" }
      );
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = `${title.toLowerCase().replace(/\s/g, "-")}.xlsx`;
      a.click();
    } catch { notify.error("Export failed"); }
  };

  const toggleCheck = (id) => setCheckedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll   = () => setCheckedIds(checkedIds.length === (students || []).length ? [] : (students || []).map((s) => s.id));

  const STATUS_COLOR = {
    green: "text-green-600", red: "text-red-600", blue: "text-blue-600", slate: "text-slate-600",
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-xl font-bold ${STATUS_COLOR[color] || ""}`}>{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {description} · {pagination?.total ?? 0} students
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === "DETAINED" && can("students.promote") && (
            <button onClick={() => navigate("/admin/students/bulk?tab=promote")}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-green-300 bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100">
              <ArrowUpCircle size={14} /> Bulk Promote
            </button>
          )}
          {can("students.export") && (
            <button onClick={handleExport}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
              <Download size={14} /> Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <StudentTable
        students={students || []}
        loading={loading}
        page={page}
        limit={limit}
        checkedIds={checkedIds}
        onToggleCheck={toggleCheck}
        onToggleAll={toggleAll}
        onPromote={setPromoteTarget}
        onChangeSection={setChangeSectionTarget}
        onToggleBlock={handleToggleBlock}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{pagination?.total ?? 0} · Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            {[10, 20, 50, 100].map((n) => (
              <button key={n} onClick={() => { setLimit(n); setPage(1); }}
                className={`h-6 px-2 rounded text-xs font-medium ${limit === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex gap-1">
            {[["«",()=>setPage(1),page===1],["‹",()=>setPage(p=>Math.max(1,p-1)),page===1],
              ["›",()=>setPage(p=>Math.min(totalPages,p+1)),page===totalPages],["»",()=>setPage(totalPages),page===totalPages]]
              .map(([l,a,d],i)=>(
                <button key={i} onClick={a} disabled={d}
                  className="h-8 w-8 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:bg-muted disabled:opacity-40">
                  {l}
                </button>
              ))}
          </div>
        )}
      </div>

      <PromoteModal open={!!promoteTarget} student={promoteTarget} onClose={() => setPromoteTarget(null)} onSuccess={load} />
      <ChangeSectionModal open={!!changeSectionTarget} student={changeSectionTarget} sections={sections} onClose={() => setChangeSectionTarget(null)} onSuccess={load} />
    </div>
  );
}

// ── Named exports for each status ─────────────────────────────
export function ActiveStudentsPage() {
  return <StudentStatusPage status="ACTIVE" title="Active Students" description="Currently enrolled and active" color="green" />;
}

export function DetainedStudentsPage() {
  return <StudentStatusPage status="DETAINED" title="Detained Students" description="Students with detained status" color="red" />;
}

export function PassedStudentsPage() {
  return <StudentStatusPage status="PASSED" title="Passed / Graduated" description="Students who have completed their program" color="blue" />;
}

export function PreviousBatchesPage() {
  return <StudentStatusPage status="previous" title="Previous Batches" description="Students from past academic sessions" color="slate" />;
}

export function OnHoldStudentsPage() {
  return (
    <StudentStatusPage
      status="ON_HOLD"
      title="On Hold"
      description="Students whose access is temporarily suspended pending review."
      color="amber"
    />
  );
}
 
export function LeftStudentsPage() {
  return (
    <StudentStatusPage
      status="LEFT"
      title="Left / TC Issued"
      description="Students who have left the institution or received a Transfer Certificate."
      color="red"
    />
  );
}
 
export function SuspendedStudentsPage() {
  return (
    <StudentStatusPage
      status="SUSPENDED"
      title="Suspended"
      description="Students currently under disciplinary suspension."
      color="red"
    />
  );
}
 