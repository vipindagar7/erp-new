// src/modules/bulk/pages/BulkHubPage.jsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, ArrowUpCircle, ArrowDownCircle, Settings, Layers, FileSpreadsheet } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VALID_STATUSES = ["ACTIVE","DETAINED","ON_HOLD","PASSED","LEFT","TRANSFERRED","SUSPENDED"];

function OperationCard({ icon: Icon, title, desc, color, onDownload, onUpload, uploading, result, children }) {
  const fileRef = useRef();
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center`}><Icon size={18} /></div>
        <div><p className="font-semibold text-sm">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      </div>
      {children}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onDownload}><Download size={12} className="mr-1.5" /> Template</Button>
        <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Upload size={12} className="mr-1.5" />{uploading ? "Processing…" : "Upload & Run"}
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onUpload} />
      </div>
      {result && (
        <div className="bg-muted/50 rounded-xl p-3 space-y-1 text-xs">
          <div className="flex gap-3 font-medium">
            <span className="text-green-600">✓ {result.promoted?.length || result.updated?.length || result.demoted?.length || 0} success</span>
            {result.skipped?.length > 0 && <span className="text-amber-600">⊘ {result.skipped.length} skipped</span>}
            <span className="text-destructive">✗ {result.failed?.length || 0} failed</span>
            <span className="text-muted-foreground">of {result.total}</span>
          </div>
          {result.failed?.slice(0,5).map((f, i) => <p key={i} className="text-muted-foreground"><span className="font-mono bg-muted px-1 rounded">{f.row}</span> {f.reason}</p>)}
          {result.failed?.length > 5 && <p className="text-muted-foreground">…and {result.failed.length - 5} more</p>}
        </div>
      )}
    </div>
  );
}

export default function BulkHubPage() {
  const navigate = useNavigate();
  const [statusResult,  setStatusResult]  = useState(null);
  const [promoteResult, setPromoteResult] = useState(null);
  const [demoteResult,  setDemoteResult]  = useState(null);
  const [uploading,     setUploading]     = useState({});

  // Section-based
  const [sections,    setSections]    = useState([]);
  const [fromSection, setFromSection] = useState("");
  const [toSection,   setToSection]   = useState("");
  const [bulkStatus,  setBulkStatus]  = useState("");
  const [sectStatus,  setSectStatus]  = useState("");
  const [sectionForStatus, setSectionForStatus] = useState("");
  const [sectResult,  setSectResult]  = useState(null);
  const [sectActing,  setSectActing]  = useState(false);

  useState(() => {
    axiosInstance.get(EP.sections.list, { params: { limit: 200, status: "ACTIVE" } })
      .then((r) => setSections(r.data?.data?.sections || []));
  }, []);

  const dl = async (url, filename) => {
    try {
      const r = await axiosInstance.get(url, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(r.data); a.download = filename; a.click();
    } catch { notify.error("Download failed"); }
  };

  const upload = (url, setter, key) => async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await axiosInstance.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setter(r.data?.data); notify.success("Done");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setUploading((u) => ({ ...u, [key]: false })); e.target.value = ""; }
  };

  const runSectionPromote = async () => {
    if (!fromSection || !toSection) { notify.error("Select both sections"); return; }
    setSectActing(true);
    try {
      const r = await axiosInstance.post(EP.bulk.sectionPromote, { from_section_id: fromSection, to_section_id: toSection, reason: "Bulk section promotion" });
      setSectResult(r.data?.data); notify.success("Section promotion done");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSectActing(false); }
  };

  const runSectionStatus = async () => {
    if (!sectionForStatus || !sectStatus) { notify.error("Select section and status"); return; }
    setSectActing(true);
    try {
      const r = await axiosInstance.post(EP.bulk.sectionStatus, { section_id: sectionForStatus, status: sectStatus, reason: "Bulk status change" });
      setSectResult(r.data?.data); notify.success("Status updated");
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSectActing(false); }
  };

  const downloadResults = async (result, sheet) => {
    try {
      const r = await axiosInstance.post(EP.bulk.exportResults + `?sheet=${sheet}`, result, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(r.data); a.download = `${sheet}-results.xlsx`; a.click();
    } catch { notify.error("Export failed"); }
  };

  const SectionSelect = ({ label, value, onChange }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select section" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Select…</SelectItem>
          {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — Sem {s.semester}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center"><FileSpreadsheet size={20} /></div>
        <div><h1 className="text-2xl font-bold">Bulk Operations</h1><p className="text-sm text-muted-foreground">Mass updates via Excel templates or by section</p></div>
      </div>

      {/* Excel-based ops */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Via Excel Template</h2>

        <OperationCard icon={Settings} title="Bulk Status Change" desc="Change academic status for many students at once" color="amber"
          onDownload={() => dl(EP.bulk.statusTemplate, "status-change-template.xlsx")}
          onUpload={upload(EP.bulk.statusUpload, setStatusResult, "status")}
          uploading={uploading.status} result={statusResult}>
          {statusResult && <Button variant="outline" size="xs" onClick={() => downloadResults(statusResult, "StatusChange")}><Download size={10} className="mr-1" /> Export Results</Button>}
        </OperationCard>

        <OperationCard icon={ArrowUpCircle} title="Bulk Promote" desc="Promote students to a new section via roll number list" color="green"
          onDownload={() => dl(EP.bulk.promoteTemplate, "promotion-template.xlsx")}
          onUpload={upload(EP.bulk.promoteUpload, setPromoteResult, "promote")}
          uploading={uploading.promote} result={promoteResult}>
          {promoteResult && <Button variant="outline" size="xs" onClick={() => downloadResults(promoteResult, "Promotions")}><Download size={10} className="mr-1" /> Export Results</Button>}
        </OperationCard>

        <OperationCard icon={ArrowDownCircle} title="Bulk Demote" desc="Demote students to a lower section via roll number list" color="red"
          onDownload={() => dl(EP.bulk.demoteTemplate, "demotion-template.xlsx")}
          onUpload={upload(EP.bulk.demoteUpload, setDemoteResult, "demote")}
          uploading={uploading.demote} result={demoteResult}>
          {demoteResult && <Button variant="outline" size="xs" onClick={() => downloadResults(demoteResult, "Demotions")}><Download size={10} className="mr-1" /> Export Results</Button>}
        </OperationCard>
      </div>

      {/* Section-based ops */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section-wise Operations</h2>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Layers size={18} /></div>
            <div><p className="font-semibold text-sm">Promote Entire Section</p><p className="text-xs text-muted-foreground">Move all ACTIVE students from one section to another. DETAINED students are skipped.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SectionSelect label="From Section" value={fromSection} onChange={setFromSection} />
            <SectionSelect label="To Section"   value={toSection}   onChange={setToSection} />
          </div>
          <Button size="sm" disabled={sectActing} onClick={runSectionPromote}><ArrowUpCircle size={13} className="mr-1.5" />{sectActing ? "Running…" : "Promote Section"}</Button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Settings size={18} /></div>
            <div><p className="font-semibold text-sm">Section Bulk Status Change</p><p className="text-xs text-muted-foreground">Set academic status for all students in a section at once.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SectionSelect label="Section" value={sectionForStatus} onChange={setSectionForStatus} />
            <div className="space-y-1">
              <Label className="text-xs">New Status</Label>
              <Select value={sectStatus || "none"} onValueChange={(v) => setSectStatus(v === "none" ? "" : v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select…</SelectItem>
                  {VALID_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" disabled={sectActing} onClick={runSectionStatus}><Settings size={13} className="mr-1.5" />{sectActing ? "Running…" : "Apply Status"}</Button>
        </div>

        {sectResult && (
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold">Section Operation Results</p>
            <div className="flex gap-3">
              <span className="text-green-600">✓ {sectResult.promoted?.length || sectResult.updated?.length || 0} success</span>
              {sectResult.skipped?.length > 0 && <span className="text-amber-600">⊘ {sectResult.skipped.length} skipped (DETAINED)</span>}
              <span className="text-destructive">✗ {sectResult.failed?.length || 0} failed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
