// src/modules/student/components/StudentModals.jsx
import { useState, useEffect } from "react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { sectionOption } from "../../../../lib/formatSection.js";

// ── Promote Modal ──────────────────────────────────────────────
export function PromoteModal({ open, student, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  if (!open || !student) return null;

  const current = student.enrollments?.find((e) => e.is_current) ||
                  student.studentEnrollments?.find((e) => e.is_current);

  const handle = async () => {
    setLoading(true);
    try {
      await axiosInstance.post(EP.students.promote(student.id));
      notify.success(`${student.first_name} promoted`);
      onSuccess?.(); onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Promotion failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-center">Promote Student</h2>
        <div className="mt-3 mb-5 text-center">
          <p className="font-medium">{student.first_name} {student.last_name}</p>
          <p className="text-sm text-muted-foreground">{student.roll_no || student.roll_number}</p>
          {current && (
            <p className="text-xs text-muted-foreground mt-1">
              Sem {current.semester} · {current.academic_year} → Sem {current.semester + 1}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={handle} disabled={loading}
            className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            ↑ Promote
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Section Modal ───────────────────────────────────────
export function ChangeSectionModal({ open, onClose, onSuccess, student, selectedStudents, sections = [] }) {
  const [sectionId, setSectionId] = useState("");
  const [remarks, setRemarks]     = useState("");
  const [loading, setLoading]     = useState(false);
  const isBulk = Array.isArray(selectedStudents) && selectedStudents.length > 0;

  useEffect(() => { if (open) { setSectionId(""); setRemarks(""); } }, [open]);
  if (!open) return null;

  const handle = async () => {
    if (!sectionId) return notify.error("Select a section");
    setLoading(true);
    try {
      if (isBulk) {
        await axiosInstance.post(EP.students.bulkChangeSection, {
          student_ids: selectedStudents.map((s) => s.id),
          section_id: sectionId,
          remarks: remarks || undefined,
        });
        notify.success(`${selectedStudents.length} students moved`);
      } else {
        await axiosInstance.patch(EP.students.changeSection(student.id), {
          section_id: sectionId,
          remarks: remarks || undefined,
        });
        notify.success("Section changed");
      }
      onSuccess?.(); onClose();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Change Section</h2>
        <p className="text-sm text-muted-foreground">
          Move {isBulk ? `${selectedStudents.length} students` : `${student?.first_name} ${student?.last_name}`} to a new section.
        </p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">New Section</label>
          <select
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select section…</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{sectionOption(s)}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Remarks (optional)</label>
          <input
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional reason" />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={handle} disabled={!sectionId || loading}
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
