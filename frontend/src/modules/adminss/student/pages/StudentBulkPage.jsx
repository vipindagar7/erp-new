// src/modules/student/pages/StudentBulkPage.jsx
// Unified bulk operations page — tabs delegate to focused sub-components
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft, Upload, ArrowUpCircle, ArrowDownCircle,
  ShieldOff, Layers, Download, Settings, Info, Users,
  CheckSquare, FileSpreadsheet,
} from "lucide-react";
import { fetchSections } from "../../../../redux/academic/academicSlice.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { notify } from "../../../../hooks/notify.js";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { sectionOption } from "../../../../lib/formatSection.js";

const TABS = [
  { key: "upload", label: "Bulk Upload", icon: Upload, perm: "students.create" }
];

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none";

// ── Shared result display ──────────────────────────────────────
function ResultBox({ result }) {
  if (!result) return null;
  const success = result.promoted?.length || result.updated?.length || result.demoted?.length || result.created?.length || 0;
  const skipped = result.skipped?.length || 0;
  const failed = result.failed?.length || 0;
  return (
    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
      <div className="flex gap-4 text-sm font-medium">
        <span className="text-green-600">✓ {success} success</span>
        {skipped > 0 && <span className="text-amber-600">⊘ {skipped} skipped</span>}
        {failed > 0 && <span className="text-red-500">✗ {failed} failed</span>}
        <span className="text-muted-foreground">of {result.total || (success + skipped + failed)}</span>
      </div>
      {result.failed?.slice(0, 5).map((f, i) => (
        <p key={i} className="text-xs text-red-500">
          <span className="font-mono bg-muted px-1 rounded mr-1">{f.row || f.roll_no || i + 1}</span>
          {f.reason || f.error}
        </p>
      ))}
      {result.failed?.length > 5 && <p className="text-xs text-muted-foreground">…and {result.failed.length - 5} more</p>}
    </div>
  );
}

// ── BULK UPLOAD TAB ────────────────────────────────────────────
function BulkUploadTab() {
  const [file, setFile] = useState(null);
  const [dragging, setDrag] = useState(false);
  const [uploading, setUpl] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("with_section");
  const fileRef = useRef();

  const download = async () => {
    try {
      const url = mode === "no_section" ? EP.students.templateNoSection : EP.students.template;
      const res = await axiosInstance.get(url, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = mode === "no_section" ? "student_template_no_section.xlsx" : "student_template.xlsx";
      a.click();
    } catch { notify.error("Download failed"); }
  };

  const upload = async () => {
    if (!file) return;
    setUpl(true); setResult(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const url = mode === "no_section" ? EP.students.bulkUploadNoSection : EP.students.bulkUpload;
      const res = await axiosInstance.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data?.data);
      const d = res.data?.data;
      notify.success(`${d.created?.length ?? 0} created, ${d.failed?.length ?? 0} failed`);
    } catch (e) { notify.error(e.response?.data?.message || "Upload failed"); }
    finally { setUpl(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">Bulk Add Students</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Download template → fill data → upload</p>
      </div>

      {/* Mode */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "with_section", label: "With Section", desc: "One sheet per section. Section pre-filled. Auto-enrolled on upload.", icon: Layers },
          { key: "no_section", label: "Without Section", desc: "Single sheet, no section. Students created UNASSIGNED — allocate section later.", icon: Users },
        ].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${mode === m.key ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <m.icon size={14} className={mode === m.key ? "text-primary" : "text-muted-foreground"} />
              <span className="text-sm font-semibold">{m.label}</span>
              {mode === m.key && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold ml-auto">Selected</span>}
            </div>
            <p className="text-xs text-muted-foreground">{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5 mb-1"><Info size={11} />Instructions</p>
        {mode === "no_section" ? (
          <ul className="text-xs text-blue-600 space-y-0.5 list-disc pl-4">
            <li>Single sheet — add all students in one go</li>
            <li>Required: email, first_name, last_name, roll_number, contact_number, father_name, mother_name</li>
            <li>Optional: department_code, program_code, batch_year, gender, dob</li>
            <li>After upload → assign sections via Change Section tab</li>
          </ul>
        ) : (
          <ul className="text-xs text-blue-600 space-y-0.5 list-disc pl-4">
            <li>One sheet per section — section metadata pre-filled (🔒 don't edit)</li>
            <li>Required: email, first_name, last_name, roll_number, contact_number, father_name, mother_name</li>
            <li>Add rows from row 3 — row 2 is example</li>
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={download} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm hover:bg-muted">
          <Download size={13} />Download Template
        </button>
      </div>

      {/* Drop zone */}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f?.name.match(/\.xlsx?$/)) setFile(f); else notify.error("Only .xlsx"); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : file ? "border-green-400 bg-green-50" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={e => setFile(e.target.files[0])} />
        {file ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm">Drag & drop or click to browse</p>
            <p className="text-xs text-muted-foreground">.xlsx only</p>
          </div>
        )}
      </div>

      {file && !result && (
        <button onClick={upload} disabled={uploading}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {uploading ? "Uploading…" : "Upload & Create Students"}
        </button>
      )}

      <ResultBox result={result} />

      {result?.created?.length > 0 && mode === "no_section" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          <strong>Next Step:</strong> {result.created.length} students created without section. Use <strong>Change Section</strong> tab to assign them.
        </div>
      )}
      {result && <button onClick={() => { setFile(null); setResult(null); }} className="h-9 px-4 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">Upload Another</button>}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────
export default function StudentBulkPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { can } = usePageGuard();
  const sections = useSelector(s => s.academic?.sections?.list ?? []);

  useEffect(() => { if (!sections.length) dispatch(fetchSections({ limit: 500 })); }, []);

  const defaultTab = searchParams.get("tab") || "upload";
  const visibleTabs = TABS.filter(t => can(t.perm));
  const [activeTab, setActiveTab] = useState(() => {
    const found = visibleTabs.findIndex(t => t.key === defaultTab);
    return found >= 0 ? found : 0;
  });

  if (!visibleTabs.length) return (
    <div className="text-center py-20 text-muted-foreground">No permission for bulk operations.</div>
  );

  const current = visibleTabs[activeTab];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/students")}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Bulk Operations</h1>
          <p className="text-sm text-muted-foreground">Perform batch actions on student records</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit flex-wrap">
        {visibleTabs.map((t, i) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setActiveTab(i)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-card border border-border rounded-2xl p-6">
        {current?.key === "upload" && <BulkUploadTab />}
      </div>
    </div>
  );
}