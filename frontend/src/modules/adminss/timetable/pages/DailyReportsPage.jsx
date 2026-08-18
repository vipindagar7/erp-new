// src/modules/timetable/pages/DailyReportsPage.jsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BarChart2, Download, RefreshCw, Loader2, Users, BookOpen, Building2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

const sel  = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const TYPES = ["FACULTY","SECTION","DEPT","BRANCH","PROGRAM","STUDENT"];
const TYPE_ICON = { FACULTY:Users, SECTION:BookOpen, DEPT:Building2, BRANCH:Building2, PROGRAM:BookOpen, STUDENT:Users };
const PCT_COLOR = (p) => p>=90?"text-green-600":p>=75?"text-blue-600":p>=60?"text-amber-600":"text-red-600";

function ReportCard({ r }) {
  const d   = r.data || {};
  const att = d.attendance || {};
  const Icon = TYPE_ICON[r.report_type] || Users;
  const name = d.faculty?.name || d.section?.name || d.dept?.name || d.branch?.name || "—";
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon size={15} className="text-primary" /></div>
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-[10px] text-muted-foreground">{r.report_type} · {r.report_date?.slice?.(0,10) || ""}</p>
          </div>
        </div>
        {att.percentage != null && (
          <div className="text-right">
            <p className={`text-xl font-bold ${PCT_COLOR(att.percentage)}`}>{att.percentage}%</p>
            <p className="text-[10px] text-muted-foreground">attendance</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[["Present",att.present,"text-green-600"],["Absent",att.absent,"text-red-600"],["Total",att.total,"text-foreground"]].map(([l,v,cls]) => (
          <div key={l} className="bg-muted/30 rounded-lg p-2 text-center">
            <p className={`font-bold text-base ${cls}`}>{v??"-"}</p>
            <p className="text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {d.lectures_taken != null && <p className="text-xs text-muted-foreground">Lectures taken: {d.lectures_taken}</p>}
      {d.lectures_held  != null && <p className="text-xs text-muted-foreground">Lectures held: {d.lectures_held}</p>}
      {d.topics?.length > 0 && (
        <div className="space-y-1">
          {d.topics.slice(0,3).map((t,i) => (
            <p key={i} className="text-xs text-muted-foreground truncate">• {t.topic}{t.subject ? ` (${t.subject})` : ""}</p>
          ))}
          {d.topics.length > 3 && <p className="text-xs text-muted-foreground">+{d.topics.length-3} more</p>}
        </div>
      )}
    </div>
  );
}

export default function DailyReportsPage() {
  const authUser  = useSelector(s => s.auth?.user);
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN" || authUser?.is_root;

  const [sessions,    setSessions]    = useState([]);
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [date,        setDate]        = useState(new Date().toISOString().slice(0,10));
  const [sessionId,   setSessionId]   = useState("");
  const [typeFilter,  setTypeFilter]  = useState("SECTION");
  const [sectionId,   setSectionId]   = useState("");
  const [deptId,      setDeptId]      = useState("");
  const [facultyId,   setFacultyId]   = useState("");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = { date, report_type: typeFilter };
    if (sessionId) params.session_id = sessionId;
    if (sectionId) params.section_id = sectionId;
    if (deptId)    params.dept_id    = deptId;
    if (facultyId) params.faculty_id = facultyId;
    axiosInstance.get(EP.timetable.dailyReports, { params })
      .then(r => setReports(r.data?.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (sessionId) load(); }, [date, sessionId, typeFilter, sectionId, deptId, facultyId]);

  const generateReports = async () => {
    if (!sessionId) { notify.error("Select a session"); return; }
    setGenerating(true);
    try {
      const r = await axiosInstance.post(EP.timetable.generateReports, { date, session_id: sessionId });
      notify.success(`Generated ${r.data?.data?.generated || 0} reports`);
      load();
    } catch (err) { notify.error(err); }
    finally { setGenerating(false); }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams({ date, report_type: typeFilter });
      if (sessionId) params.append("session_id", sessionId);
      if (sectionId) params.append("section_id", sectionId);
      if (deptId)    params.append("dept_id",    deptId);
      if (facultyId) params.append("faculty_id", facultyId);
      const r = await axiosInstance.get(`${EP.timetable.exportReport}?${params}`, { responseType:"blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = `daily-report-${date}.xlsx`;
      a.click(); URL.revokeObjectURL(a.href);
    } catch { notify.error("Export failed"); }
    finally { setDownloading(false); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-20">
        <BarChart2 size={28} className="mx-auto text-muted-foreground/20 mb-3" />
        <p className="font-medium text-destructive">Access Restricted</p>
        <p className="text-sm text-muted-foreground mt-1">Daily reports are visible to Super Admin and Root Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><BarChart2 size={20} className="text-primary" /><h1 className="text-xl font-bold">Daily Reports</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={downloading} onClick={download}>
            {downloading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}Export
          </Button>
          <Button size="sm" disabled={generating} onClick={generateReports}>
            {generating ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <RefreshCw size={13} className="mr-1.5" />}Generate
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        Click <strong>Generate</strong> to create today's reports from attendance + topics data. Reports can also be auto-generated via cron at end of day.
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={sel} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Session</Label>
            <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={sel}>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" ●":""}</option>)}
            </select>
          </div>
          {typeFilter === "SECTION" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <SearchSelect endpoint={EP.sections.list} dataPath="sections" valueKey="id" labelKey="name"
                value={sectionId} onChange={v => setSectionId(v)} placeholder="All sections" />
            </div>
          )}
          {typeFilter === "DEPT" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <SearchSelect endpoint={EP.departments.list} dataPath="departments" valueKey="id" labelKey="name"
                value={deptId} onChange={v => setDeptId(v)} placeholder="All departments" />
            </div>
          )}
          {typeFilter === "FACULTY" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Faculty</Label>
              <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
                value={facultyId} onChange={v => setFacultyId(v)} placeholder="All faculty" />
            </div>
          )}
        </div>

        {/* Type tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${typeFilter===t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Reports */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-14 space-y-3">
          <BarChart2 size={28} className="mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No reports for {date}</p>
          <p className="text-xs text-muted-foreground/60">Click Generate to create reports from today's attendance data</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{reports.length} reports for {date}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reports.map(r => <ReportCard key={r.id} r={r} />)}
          </div>
        </>
      )}
    </div>
  );
}