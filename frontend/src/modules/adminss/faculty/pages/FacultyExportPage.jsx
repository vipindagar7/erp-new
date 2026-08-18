
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Check } from "lucide-react";
import { fetchDepartments } from "../../../../redux/academic/academicSlice.js";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

export function FacultyExportPage() {
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const departments = useSelector((s) => s.academic?.departments?.list ?? []);

  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => { if (!departments.length) dispatch(fetchDepartments({ limit: 200 })); }, []);

  const handleExport = async () => {
    setLoading(true); setDone(false);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await axiosInstance.get(`/api/faculty/export-advanced?${params}`, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = `faculty-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      setDone(true);
      notify.success("Export downloaded");
    } catch { notify.error("Export failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/faculty")}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Export Faculty</h1>
          <p className="text-sm text-muted-foreground">Multi-sheet Excel with complete HR data</p>
        </div>
      </div>

      {/* Sheets info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold">Sheets Included</p>
        <div className="grid grid-cols-2 gap-2">
          {["Summary","All Faculty","Per-Department Sheets","Gender Analysis"].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded-lg">
              <FileSpreadsheet size={13} className="text-green-600 shrink-0" />
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Note: Salary and bank account are NOT included in exports for security.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold">Filter (Optional)</p>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Department</label>
          <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            value={filters.dept_id || ""} onChange={(e) => setFilters((f) => ({ ...f, dept_id: e.target.value || undefined }))}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <button onClick={handleExport} disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Generating…</> :
           done    ? <><Check size={16} /> Downloaded</> :
                     <><Download size={16} /> Download Excel</>}
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// src/modules/faculty/pages/FacultyBulkPage.jsx
// ─────────────────────────────────────────────────────────────
import { useRef } from "react";
import { useNavigate as useNav } from "react-router-dom";
import { Upload, ArrowLeft as AL } from "lucide-react";
import { EP as EP2 } from "../../../../config/api.config.js";
import { notify as n } from "../../../../hooks/notify.js";

export function FacultyBulkPage() {
  const navigate = useNav();
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults]   = useState(null);
  const fileRef = useRef();

  const downloadTemplate = async () => {
    try {
      const res = await axiosInstance.get(EP2.faculty.template, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([res.data]));
      a.download = "faculty_template.xlsx"; a.click();
    } catch { n.error("Failed to download template"); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setResults(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await axiosInstance.post(EP2.faculty.bulkUpload, fd, { headers: { "Content-Type": "multipart/form-data" } });
      const d = res.data.data;
      setResults(d);
      n.success(`${d.created?.length ?? 0} faculty created`);
    } catch (err) { n.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/faculty")}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <AL size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Bulk Upload Faculty</h1>
          <p className="text-sm text-muted-foreground">Upload multiple faculty members via Excel</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Download template, fill data, upload.</p>
        <button onClick={downloadTemplate}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
          ↓ Download Template
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.name.match(/\.xlsx?$/)) setFile(f); else n.error("Only .xlsx"); }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : file ? "border-green-400 bg-green-50" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
        <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        {file ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">{file.name}</p>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-destructive hover:underline">Remove</button>
          </div>
        ) : (
          <div className="space-y-1">
            <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm">Drag & drop or click to browse</p>
            <p className="text-xs text-muted-foreground">.xlsx only</p>
          </div>
        )}
      </div>

      {file && !results && (
        <button onClick={handleUpload} disabled={uploading}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          {uploading ? "Uploading…" : "Upload Faculty"}
        </button>
      )}

      {results && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{results.created?.length ?? 0}</p>
            <p className="text-xs text-green-600 font-medium">Created</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{results.failed?.length ?? 0}</p>
            <p className="text-xs text-red-600 font-medium">Failed</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <p className="text-2xl font-bold">{results.total ?? 0}</p>
            <p className="text-xs text-muted-foreground font-medium">Total</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyBulkPage;
