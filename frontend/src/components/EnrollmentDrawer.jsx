// frontend/src/components/admin/EnrollmentDrawer.jsx
import { useEffect, useState } from "react";
import { X, Plus, Star, Pencil, CheckCircle } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { notify } from "../../lib/notify.js";
import { cn } from "../../lib/utils.js";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "DROPPED", "GRADUATED", "SUSPENDED"];

const emptyForm = {
  section_id: "",
  course_id: "",
  program_id: "",
  dept_id: "",
  academic_year: "",
  semester: "",
  batch_year: "",
  status: "ACTIVE",
  remarks: "",
  is_current: false,
};

export default function EnrollmentDrawer({ studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Dropdown options
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [depts, setDepts] = useState([]);

  useEffect(() => {
    load();
    loadOptions();
  }, [studentId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(EP.students.enrollments(studentId));
      setData(res.data);
    } catch {
      notify.error("Failed to load enrollment history");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [sec, cou, prog, dep] = await Promise.all([
        axiosInstance.get(EP.sections.list, { params: { limit: 200 } }),
        axiosInstance.get(EP.courses.list, { params: { limit: 200 } }),
        axiosInstance.get(EP.programs.list, { params: { limit: 200 } }),
        axiosInstance.get(EP.departments.list, { params: { limit: 200 } }),
      ]);
      const toArr = (d, k) => Array.isArray(d) ? d : (d && Array.isArray(d[k]) ? d[k] : []);
      setSections(toArr(sec.data, "sections"));
      setCourses(toArr(cou.data, "courses"));
      setPrograms(toArr(prog.data, "programs"));
      setDepts(toArr(dep.data, "departments"));
    } catch {/* silent */ }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const startEdit = (enrollment) => {
    setEditId(enrollment.id);
    setForm({
      section_id: enrollment.section_id ?? "",
      course_id: enrollment.course_id ?? "",
      program_id: enrollment.program_id ?? "",
      dept_id: enrollment.dept_id ?? "",
      academic_year: enrollment.academic_year ?? "",
      semester: enrollment.semester ?? "",
      batch_year: enrollment.batch_year ?? "",
      status: enrollment.status ?? "ACTIVE",
      remarks: enrollment.remarks ?? "",
      is_current: enrollment.is_current ?? false,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        semester: form.semester ? parseInt(form.semester) : undefined,
        batch_year: form.batch_year ? parseInt(form.batch_year) : undefined,
        section_id: form.section_id || undefined,
        course_id: form.course_id || undefined,
        program_id: form.program_id || undefined,
        dept_id: form.dept_id || undefined,
      };

      if (editId) {
        await axiosInstance.patch(EP.students.enrollmentById(studentId, editId), payload);
        notify.success("Enrollment updated");
      } else {
        await axiosInstance.post(EP.students.enrollments(studentId), payload);
        notify.success("Enrollment added");
      }
      resetForm();
      load();
    } catch (err) {
      notify.error(err.response?.data?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (enrollId) => {
    try {
      await axiosInstance.patch(EP.students.setCurrentEnrollment(studentId, enrollId));
      notify.success("Current enrollment updated");
      load();
    } catch {
      notify.error("Failed to set current enrollment");
    }
  };

  const sel = (arr, id) => arr.find((x) => x.id === id)?.name ?? "—";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Enrollment History</h2>
            {data?.student && (
              <p className="text-sm text-slate-500">{data.student.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Add
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-medium text-slate-700 mb-4">{editId ? "Edit Enrollment" : "Add Enrollment Record"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["academic_year", "Academic Year", "text", "e.g. 2024-25"],
                ["semester", "Semester", "number", "1-8"],
                ["batch_year", "Batch Year", "number", "e.g. 2022"],
              ].map(([name, label, type, placeholder]) => (
                <div key={name}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Section</label>
                <select name="section_id" value={form.section_id} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">— None —</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Course</label>
                <select name="course_id" value={form.course_id} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">— None —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Program */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
                <select name="program_id" value={form.program_id} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">— None —</option>
                  {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Department</label>
                <select name="dept_id" value={form.dept_id} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">— None —</option>
                  {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              {/* Remarks */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                <input type="text" name="remarks" value={form.remarks} onChange={handleChange} placeholder="Optional notes"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Is Current */}
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" name="is_current" id="is_current" checked={form.is_current} onChange={handleChange}
                  className="w-4 h-4 rounded accent-blue-600" />
                <label htmlFor="is_current" className="text-sm text-slate-600">Set as current enrollment</label>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? "Saving…" : editId ? "Update" : "Add Record"}
              </button>
              <button onClick={resetForm}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Enrollment list */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : data?.enrollments?.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12">No enrollment records found</div>
          ) : (
            <div className="space-y-3">
              {(data?.enrollments ?? []).map((e) => (
                <div key={e.id}
                  className={cn(
                    "border rounded-xl p-4 transition-colors",
                    e.is_current
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  )}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">
                          Sem {e.semester ?? "?"} · {e.academic_year ?? "—"}
                        </span>
                        {e.is_current && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                            <Star size={10} fill="currentColor" /> Current
                          </span>
                        )}
                        <span className={cn(
                          "text-[11px] font-medium px-2 py-0.5 rounded-full",
                          e.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                            e.status === "GRADUATED" ? "bg-purple-100 text-purple-700" :
                              e.status === "DROPPED" ? "bg-red-100 text-red-700" :
                                "bg-slate-100 text-slate-600"
                        )}>
                          {e.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        {e.section && <p>Section: {e.section.name}</p>}
                        {e.course && <p>Course: {e.course.name}</p>}
                        {e.program && <p>Program: {e.program.name}</p>}
                        {e.department && <p>Dept: {e.department.name}</p>}
                        {e.batch_year && <p>Batch: {e.batch_year}</p>}
                        {e.remarks && <p className="italic">"{e.remarks}"</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!e.is_current && (
                        <button onClick={() => handleSetCurrent(e.id)} title="Set as current"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => startEdit(e)} title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}