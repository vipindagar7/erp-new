// src/modules/section/pages/SectionGraduatePage.jsx
import { useState, useEffect, useCallback } from "react";
import { GraduationCap, Search, CheckCircle, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }  from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

export default function SectionGraduatePage() {
  const [sections,    setSections]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [selected,    setSelected]    = useState(new Set());
  const [search,      setSearch]      = useState("");
  const [branchFilter,setBranchFilter]= useState("");
  const [semFilter,   setSemFilter]   = useState("8"); // default to final sem
  const [reason,      setReason]      = useState("");
  const [acting,      setActing]      = useState(false);
  const [result,      setResult]      = useState(null);
  const [showDetail,  setShowDetail]  = useState(false);
  const [secStatus,   setSecStatus]   = useState("ACTIVE");
  const [confirmed,   setConfirmed]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.sections.list, {
        params: {
          limit: 200, status: "ACTIVE",
          branch_id: branchFilter || undefined,
          semester:  semFilter    || undefined,
          search:    search       || undefined,
        },
      });
      setSections(r.data?.data?.sections || []);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  }, [branchFilter, semFilter, search, secStatus]);

  useEffect(() => { load(); }, [load]);

  const toggle    = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = ()   => setSelected((p) => p.size === sections.length ? new Set() : new Set(sections.map((s) => s.id)));

  const totalStudents = sections.filter((s) => selected.has(s.id)).reduce((a, s) => a + (s._count?.students || 0), 0);

  const submit = async () => {
    if (!selected.size) { notify.error("Select at least one section"); return; }
    if (!confirmed)     { notify.error("Please confirm the graduation checkbox"); return; }
    setActing(true); setResult(null);
    try {
      const r = await axiosInstance.post(
        `${EP.sections.list.replace("/sections","")}/sections/graduate`,
        { section_ids: [...selected], reason: reason || "End of program graduation" }
      );
      const d = r.data?.data;
      setResult(d);
      notify.success(`${d.sections?.graduated?.length || 0} sections graduated — ${d.students?.passed || 0} students marked PASSED`);
      setSelected(new Set()); setConfirmed(false); load();
    } catch (err) { notify.error(err); }
    finally { setActing(false); }
  };

  const successList = result?.sections?.graduated || [];
  const failList    = result?.sections?.failed    || [];
  const skipList    = result?.sections?.skipped   || [];

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" />
          <h1 className="text-xl font-bold">Graduate Sections</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Mark final-semester sections as completed. All active students become alumni.</p>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><Info size={13} /> What happens on graduation:</p>
        <p>• All <strong>ACTIVE</strong> students → status <strong>PASSED</strong>, marked as alumni</p>
        <p>• Students' login is <strong>not blocked</strong> (alumni can still access their records)</p>
        <p>• Current enrollments are closed with status PASSED</p>
        <p>• Section status → <strong>COMPLETED</strong></p>
        <p>• Full snapshot taken before — rollback available for root admin</p>
        <p>• DETAINED students are <strong>not</strong> marked PASSED</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections…" className="pl-9 h-9" />
        </div>
        <div className="w-52">
          <SearchSelect endpoint={EP.branches.list} dataPath="branches" valueKey="id" labelKey="name"
            value={branchFilter} onChange={(v) => setBranchFilter(v)} placeholder="All branches" />
        </div>
        <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={secStatus} onChange={(e) => setSecStatus(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm">
          <option value="ACTIVE">Active only</option>
          <option value="">All sections</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Sections table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
          <input type="checkbox" className="w-4 h-4"
            checked={selected.size === sections.length && sections.length > 0}
            onChange={toggleAll} />
          <span className="text-xs font-semibold text-muted-foreground uppercase">
            {loading ? "Loading…" : `${sections.length} sections`}
          </span>
          {selected.size > 0 && (
            <span className="ml-auto text-xs font-medium text-primary">{selected.size} selected · {totalStudents} students</span>
          )}
        </div>

        <div className="divide-y divide-border max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : sections.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No active sections found for selected filters</div>
          ) : sections.map((s) => (
            <label key={s.id} className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${selected.has(s.id) ? "bg-primary/5" : "hover:bg-muted/20"}`}>
              <input type="checkbox" className="w-4 h-4 shrink-0" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{s.name}</p>
                  <span className="text-xs font-mono text-muted-foreground">{s.code}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.branch?.name} · {s.branch?.program?.name}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-right">
                <div>
                  <p className="text-xs font-semibold text-primary">Sem {s.semester}</p>
                  <p className="text-[10px] text-muted-foreground">{s.academic_year || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium">{s._count?.students || 0}</p>
                  <p className="text-[10px] text-muted-foreground">students</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Confirm + Submit */}
      {selected.size > 0 && (
        <div className="bg-card border border-amber-300 rounded-2xl p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-medium text-amber-800">
            You are about to graduate <strong>{selected.size} section{selected.size !== 1 ? "s" : ""}</strong> containing approximately <strong>{totalStudents} students</strong>.
            This will permanently mark them as PASSED / Alumni.
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="e.g. End of 2024-28 batch graduation ceremony" />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 mt-0.5 shrink-0" checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)} />
            <span className="text-sm text-muted-foreground">
              I confirm that these sections have completed their program and all active students should be marked as <strong>PASSED</strong> and become alumni.
            </span>
          </label>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setSelected(new Set()); setConfirmed(false); }}>Cancel</Button>
            <Button className="flex-1 bg-primary" disabled={acting || !confirmed} onClick={submit}>
              {acting
                ? <><Loader2 size={13} className="mr-1.5 animate-spin" /> Graduating…</>
                : <><GraduationCap size={13} className="mr-1.5" /> Graduate {selected.size} Section{selected.size !== 1 ? "s" : ""}</>
              }
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold">Graduation Results</p>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Sections Graduated", value: successList.length,       color: "green" },
              { label: "Sections Skipped",   value: skipList.length,          color: "amber" },
              { label: "Sections Failed",    value: failList.length,          color: "red"   },
              { label: "Students Passed",    value: result.students?.passed || 0, color: "blue" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
                <p className={`text-xs text-${color}-700`}>{label}</p>
              </div>
            ))}
          </div>

          {result.students?.failed > 0 && (
            <p className="text-xs text-destructive">{result.students.failed} student(s) failed to update — check logs.</p>
          )}

          <button onClick={() => setShowDetail((d) => !d)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            {showDetail ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {showDetail ? "Hide" : "Show"} section details
          </button>

          {showDetail && (
            <div className="space-y-2">
              {successList.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <CheckCircle size={11} className="text-green-500 shrink-0" />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">Sem {s.semester}</span>
                  <span className="ml-auto text-green-600">{s.students_passed} students passed</span>
                </div>
              ))}
              {skipList.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <AlertCircle size={11} className="text-amber-500 shrink-0" />
                  <span>{s.name || s.id}</span>
                  <span className="ml-auto text-amber-600">{s.reason}</span>
                </div>
              ))}
              {failList.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <XCircle size={11} className="text-destructive shrink-0" />
                  <span>{s.id}</span>
                  <span className="ml-auto text-destructive">{s.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}