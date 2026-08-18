// src/modules/section/pages/SectionStudentsPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Search, Plus, Trash2, Download,
  Upload, Tag, X, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Filter, FileSpreadsheet, Loader2,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const STATUS_COLOR = {
  ACTIVE:"bg-green-100 text-green-700", DETAINED:"bg-amber-100 text-amber-700",
  ON_HOLD:"bg-orange-100 text-orange-700", PASSED:"bg-blue-100 text-blue-700",
  LEFT:"bg-red-100 text-red-700",
};
const GROUP_COLOR = { G1:"bg-blue-100 text-blue-700", G2:"bg-violet-100 text-violet-700", G3:"bg-green-100 text-green-700" };

function ResultPanel({ result }) {
  const [showFail, setShowFail] = useState(false);
  if (!result) return null;
  const ok_   = result.added || result.removed || result.assigned || [];
  const fail_ = result.failed || [];
  const skip_ = result.already_in || result.skipped || [];
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2 text-xs">
      <div className="flex gap-4">
        {ok_.length > 0   && <span className="text-green-600 font-medium">✓ {ok_.length} done</span>}
        {skip_.length > 0 && <span className="text-amber-600">⚠ {skip_.length} skipped</span>}
        {fail_.length > 0 && <button onClick={() => setShowFail(s => !s)} className="text-destructive hover:underline flex items-center gap-0.5">{showFail ? <ChevronUp size={10}/> : <ChevronDown size={10}/>} {fail_.length} failed</button>}
      </div>
      {showFail && fail_.map((r, i) => (
        <div key={i} className="flex gap-2"><XCircle size={10} className="text-destructive shrink-0 mt-0.5" /><span className="font-mono text-muted-foreground">{r.id || r.uid || r.student_id}</span><span className="text-destructive">{r.reason}</span></div>
      ))}
    </div>
  );
}

export default function SectionStudentsPage() {
  const { id: section_id } = useParams();
  const navigate = useNavigate();
  const fileRef  = useRef(null);
  const addFileRef = useRef(null);

  const [section,   setSection]   = useState(null);
  const [students,  setStudents]  = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(new Set());
  const [result,    setResult]    = useState(null);
  const [acting,    setActing]    = useState(false);

  // Filters
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState("");
  const [groupF,     setGroupF]     = useState("");
  const [page,       setPage]       = useState(1);

  // Panels
  const [addPanel,    setAddPanel]    = useState(false);
  const [groupPanel,  setGroupPanel]  = useState(false);
  const [assignPanel, setAssignPanel] = useState(false);
  const [assigning,   setAssigning]   = useState(false);
  const assignFileRef = useRef(null);

  // Add students panel
  const [addSearch,  setAddSearch]  = useState("");
  const [candidates, setCandidates] = useState([]);
  const [addSel,     setAddSel]     = useState(new Set());

  // Group assign
  const [groupMode,  setGroupMode]  = useState("picker"); // picker | template
  const [groupAssignments, setGroupAssignments] = useState({}); // { student_id: group_no }

  const loadSection = async () => {
    try { setSection((await axiosInstance.get(EP.sections.byId(section_id))).data?.data); }
    catch {}
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(`${EP.sections.byId(section_id)}/students`, {
        params: { search: search || undefined, status: statusF || undefined, group_no: groupF || undefined, page, limit: 100 },
      });
      const d = r.data?.data;
      setStudents(d?.students || []);
      setTotal(d?.pagination?.total || 0);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  }, [section_id, search, statusF, groupF, page]);

  useEffect(() => { loadSection(); }, [section_id]);
  useEffect(() => { load(); }, [load]);

  const loadCandidates = useCallback(async () => {
    if (!addSearch || addSearch.length < 2) { setCandidates([]); return; }
    try {
      const r = await axiosInstance.get(EP.students.list, { params: { search: addSearch, limit: 30 } });
      setCandidates(r.data?.data?.students || []);
    } catch {}
  }, [addSearch]);

  useEffect(() => { const t = setTimeout(loadCandidates, 300); return () => clearTimeout(t); }, [loadCandidates]);

  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((p) => p.size === students.length ? new Set() : new Set(students.map((s) => s.id)));

  // ── Add students ─────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addSel.size) { notify.error("Select students to add"); return; }
    setActing(true);
    try {
      const r = await axiosInstance.post(`${EP.sections.byId(section_id)}/add-students`, { student_ids: [...addSel] });
      setResult(r.data?.data); load(); setAddSel(new Set()); setAddSearch(""); setAddPanel(false);
      notify.success(`${r.data?.data?.added?.length || 0} students added`);
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  // ── Remove students ───────────────────────────────────────────
  const handleRemove = async () => {
    if (!selected.size) { notify.error("Select students to remove"); return; }
    setActing(true);
    try {
      const r = await axiosInstance.post(`${EP.sections.byId(section_id)}/remove-students`, { student_ids: [...selected] });
      setResult(r.data?.data); setSelected(new Set()); load();
      notify.success(`${r.data?.data?.removed?.length || 0} removed`);
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  // ── Group assign (picker) ─────────────────────────────────────
  const handleGroupAssign = async () => {
    const assignments = Object.entries(groupAssignments).map(([student_id, group_no]) => ({ student_id, group_no }));
    if (!assignments.length) { notify.error("No group assignments made"); return; }
    setActing(true);
    try {
      const r = await axiosInstance.post(`${EP.sections.byId(section_id)}/assign-groups`, { assignments });
      setResult(r.data?.data); load(); setGroupAssignments({}); setGroupPanel(false);
      notify.success(`${r.data?.data?.assigned?.length || 0} groups assigned`);
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  // ── Group template ────────────────────────────────────────────
  const downloadGroupTemplate = async () => {
    try {
      const r = await axiosInstance.get(`${EP.sections.byId(section_id)}/group-template`, { responseType: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(r.data);
      a.download = `group-assign-${section?.code || section_id}.xlsx`; a.click();
    } catch { notify.error("Download failed"); }
  };

  const uploadGroupTemplate = async (file) => {
    setActing(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r  = await axiosInstance.post(`${EP.sections.byId(section_id)}/group-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(r.data?.data); load();
      notify.success(`${r.data?.data?.assigned?.length || 0} groups updated`);
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  const groups = [...new Set(students.map((s) => s.group_no).filter(Boolean))].sort();

  // ── Assign section via template ────────────────────────────
  const downloadAssignTemplate = async () => {
    setAssigning(true);
    try {
      const r = await axiosInstance.get(EP.students.sectionAssignTemplate, {
        params: { section_id },
        responseType: "blob",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = `section-assign-${section?.code || section_id}-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify.error("Download failed"); }
    finally { setAssigning(false); }
  };

  const uploadAssignTemplate = async (file) => {
    setAssigning(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r  = await axiosInstance.post(EP.students.sectionAssignUpload, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(r.data?.data);
      const d = r.data?.data;
      notify.success(`${d?.assigned?.length || 0} assigned · ${d?.skipped?.length || 0} skipped · ${d?.failed?.length || 0} failed`);
      load();
    } catch (err) { notify.error(err); }
    finally { setAssigning(false); }
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.sections.detail(section_id))}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h1 className="text-xl font-bold">Students — {section?.name}</h1>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{total}</span>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {section?.branch?.name} · Sem {section?.semester} · {section?.academic_year}
            {section?.is_combined && <span className="ml-2 text-indigo-600 font-medium">[Combined]</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selected.size > 0 && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30"
              onClick={handleRemove} disabled={acting}>
              <Trash2 size={13} className="mr-1.5" /> Remove {selected.size}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setAssignPanel((p) => !p)}>
            <FileSpreadsheet size={13} className="mr-1.5" /> Assign via Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setGroupPanel((p) => !p)}>
            <Tag size={13} className="mr-1.5" /> Groups
          </Button>
          <Button size="sm" onClick={() => setAddPanel((p) => !p)}>
            <Plus size={13} className="mr-1.5" /> Add Students
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, roll no…" className="pl-9 h-9" />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">All Status</option>
          {["ACTIVE","DETAINED","ON_HOLD","PASSED","LEFT"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={groupF} onChange={(e) => setGroupF(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">All Groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          {groups.length === 0 && <option value="" disabled>No groups assigned yet</option>}
        </select>
      </div>


      {/* Assign via Template Panel */}
      {assignPanel && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Assign Students to Sections via Template</p>
            <button onClick={() => setAssignPanel(false)} className="p-1 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
          </div>
          <div className="text-xs font-mono bg-muted/40 rounded-lg px-4 py-3 space-y-1">
            <p className="font-sans text-muted-foreground mb-2">Template pre-filled with this section's students. Fill <strong>new_section_code</strong> column for each student you want to move.</p>
            <p><strong>uid*</strong> — Roll No or Enrollment No (pre-filled)</p>
            <p><strong>new_section_code*</strong> — Section code from the reference sheet</p>
            <p><strong>reason</strong> — Optional</p>
            <p className="text-muted-foreground">Other columns are info-only</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" disabled={assigning} onClick={downloadAssignTemplate}>
              {assigning ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
              Download Template
            </Button>
            <Button disabled={assigning} onClick={() => assignFileRef.current?.click()}>
              {assigning ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Upload size={13} className="mr-1.5" />}
              {assigning ? "Uploading…" : "Upload Filled Template"}
            </Button>
            <input ref={assignFileRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value=""; uploadAssignTemplate(f); } }} />
          </div>
        </div>
      )}

      {/* Add Students Panel */}
      {addPanel && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Add Students to Section</p>
            <button onClick={() => { setAddPanel(false); setAddSel(new Set()); setAddSearch(""); }}
              className="p-1 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
              placeholder="Search by name, roll no, email…" className="pl-9" autoFocus />
          </div>
          {candidates.length > 0 && (
            <div className="border border-border rounded-xl max-h-48 overflow-y-auto divide-y divide-border">
              {candidates.map((s) => (
                <label key={s.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/10 ${addSel.has(s.id) ? "bg-primary/5" : ""}`}>
                  <input type="checkbox" className="w-3.5 h-3.5 shrink-0" checked={addSel.has(s.id)}
                    onChange={() => setAddSel((p) => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.roll_no} · {s.section?.name || "No section"} · {s.status}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {addSearch.length >= 2 && candidates.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No students found</p>
          )}
          {addSel.size > 0 && (
            <Button className="w-full" disabled={acting} onClick={handleAdd}>
              {acting ? "Adding…" : `Add ${addSel.size} Students to ${section?.name}`}
            </Button>
          )}
        </div>
      )}

      {/* Group Panel */}
      {groupPanel && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Assign Groups</p>
            <button onClick={() => setGroupPanel(false)} className="p-1 rounded hover:bg-muted text-muted-foreground"><X size={14} /></button>
          </div>
          <div className="flex gap-2">
            {["picker","template"].map((m) => (
              <button key={m} onClick={() => setGroupMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${groupMode === m ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
                {m === "picker" ? "Assign Here" : "Via Template"}
              </button>
            ))}
          </div>
          {groupMode === "picker" && (
            <>
              <div className="max-h-48 overflow-y-auto divide-y divide-border border border-border rounded-xl">
                {students.filter((s) => s.status === "ACTIVE" || s.status === "DETAINED").map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2">
                    <p className="flex-1 text-xs font-medium">{s.name} <span className="text-muted-foreground font-mono">{s.roll_no}</span></p>
                    <div className="flex gap-1">
                      {["G1","G2","G3"].map((g) => (
                        <button key={g} onClick={() => setGroupAssignments((p) => ({ ...p, [s.id]: groupAssignments[s.id] === g ? null : g }))}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${(groupAssignments[s.id] || s.group_no) === g ? GROUP_COLOR[g] || "bg-primary/20 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                          {g}
                        </button>
                      ))}
                      {(groupAssignments[s.id] || s.group_no) && (
                        <button onClick={() => setGroupAssignments((p) => ({ ...p, [s.id]: null }))}
                          className="px-1.5 rounded hover:bg-red-50 text-destructive text-xs">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(groupAssignments).length > 0 && (
                <Button className="w-full" disabled={acting} onClick={handleGroupAssign}>
                  {acting ? "Saving…" : `Save ${Object.keys(groupAssignments).length} Group Assignments`}
                </Button>
              )}
            </>
          )}
          {groupMode === "template" && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadGroupTemplate}><Download size={13} className="mr-1.5" />Download Template</Button>
              <Button onClick={() => fileRef.current?.click()}><Upload size={13} className="mr-1.5" />Upload</Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { e.target.value=""; uploadGroupTemplate(f); } }} />
            </div>
          )}
        </div>
      )}

      <ResultPanel result={result} />

      {/* Students table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <input type="checkbox" className="w-4 h-4"
            checked={selected.size === students.length && students.length > 0} onChange={toggleAll} />
          <span className="text-xs text-muted-foreground">{loading ? "Loading…" : `${students.length} of ${total}`}</span>
          {selected.size > 0 && <span className="ml-auto text-xs font-medium text-primary">{selected.size} selected</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/10">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                {["Student","Roll No","Group","Status","Gender","Batch",""].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">Loading…</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No students in this section. Add students above.</td></tr>
              ) : students.map((s) => (
                <tr key={s.id} className={`hover:bg-muted/10 ${selected.has(s.id) ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3"><input type="checkbox" className="w-4 h-4" checked={selected.has(s.id)} onChange={() => toggle(s.id)} /></td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{s.roll_no || "—"}</td>
                  <td className="px-3 py-3">
                    {s.group_no
                      ? <span className={`text-xs px-2 py-0.5 rounded font-medium ${GROUP_COLOR[s.group_no] || "bg-muted"}`}>{s.group_no}</span>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[s.status] || "bg-muted"}`}>{s.status}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.gender || "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.batch_year || "—"}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => navigate(ROUTES.students.detail(s.id))}
                      className="text-xs text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > 100 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {students.length} of {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={students.length < 100} onClick={() => setPage(p => p+1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
