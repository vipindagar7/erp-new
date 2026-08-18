// src/modules/adminss/timetable/pages/TimetablePrintPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const DAYS = ["MON","TUE","WED","THU","FRI","SAT"];
const TYPE_COLOR = { LECTURE:"#dbeafe", LAB:"#dcfce7", TUTORIAL:"#f3e8ff" };

export default function TimetablePrintPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get("section_id");
  const printRef  = useRef();

  const [timetable, setTimetable] = useState(null);
  const [periods,   setPeriods]   = useState([]);
  const [sections,  setSections]  = useState([]);
  const [selSection,setSelSection]= useState(sectionId || "");
  const [sessions,  setSessions]  = useState([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.sections.list + "?status=ACTIVE&limit=200"),
      axiosInstance.get(EP.sessions.list),
    ]).then(([secRes, sesRes]) => {
      setSections(secRes.data?.data?.sections || secRes.data?.data || []);
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur && selSection) loadTimetable(selSection, cur.id);
    }).catch(() => {});
  }, []);

  const loadTimetable = async (secId, sessionId) => {
    if (!secId) return;
    setLoading(true);
    try {
      const [ttRes, pRes] = await Promise.all([
        axiosInstance.get(EP.timetable.bySection(secId)),
        axiosInstance.get(EP.timetable.periods(sessionId)),
      ]);
      setTimetable(ttRes.data?.data);
      setPeriods((pRes.data?.data || []).filter(p => !["LUNCH","BREAK","ASSEMBLY"].includes(p.type)));
    } catch { notify.error("Failed to load timetable"); }
    finally { setLoading(false); }
  };

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const section = sections.find(s => s.id === selSection);
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Timetable - ${section?.name}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:16px;font-size:11px;}
      h2,h3{text-align:center;margin:4px 0;}
      table{width:100%;border-collapse:collapse;}
      td,th{border:1px solid #cbd5e1;padding:6px 8px;vertical-align:middle;}
      th{background:#f1f5f9;font-weight:700;text-align:center;}
      .lec{background:#dbeafe;} .lab{background:#dcfce7;} .tut{background:#f3e8ff;}
      @media print{@page{size:A4 landscape;margin:8mm;}body{padding:0;}}
    </style></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  // Build grid: day × period
  const entries = timetable?.entries || [];
  const grid = {};
  DAYS.forEach(d => {
    grid[d] = {};
    periods.forEach(p => { grid[d][p.id] = null; });
  });
  entries.forEach(e => {
    if (grid[e.day]) grid[e.day][e.period_config_id] = e;
  });

  const section = sections.find(s => s.id === selSection);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/timetable")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex-1">Printable Timetable</h1>
        {timetable && (
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Printer size={14}/>Print / PDF
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <select value={selSection} onChange={e => {
            setSelSection(e.target.value);
            const cur = sessions.find(s => s.is_current);
            if (cur) loadTimetable(e.target.value, cur.id);
          }}
          className="flex-1 h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          <option value="">Select section…</option>
          {sections.map(s => <option key={s.id} value={s.id}>{s.name} — Sem {s.semester}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>
      ) : !timetable ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl text-sm text-muted-foreground">
          Select a section to view its timetable
        </div>
      ) : (
        <div ref={printRef} className="overflow-x-auto">
          {/* Print header */}
          <div className="text-center mb-4 space-y-1">
            <h2 className="text-lg font-black">ECHELON INSTITUTE OF TECHNOLOGY</h2>
            <h3 className="text-base font-bold">Class Timetable</h3>
            <p className="text-sm text-muted-foreground">
              Section: {section?.name} | Semester: {section?.semester} | Batch: {section?.batch}
            </p>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-border px-3 py-2 bg-muted/30 font-bold w-16">Day</th>
                {periods.map(p => (
                  <th key={p.id} className="border border-border px-3 py-2 bg-muted/30 font-bold text-center min-w-[100px]">
                    <div>{p.name}</div>
                    <div className="text-[10px] font-normal text-muted-foreground">{p.start_time}–{p.end_time}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="border border-border px-3 py-2 font-bold text-center bg-muted/20">{day}</td>
                  {periods.map(p => {
                    const e = grid[day]?.[p.id];
                    const bg = e ? (TYPE_COLOR[e.entry_type] || "#f8fafc") : "#ffffff";
                    return (
                      <td key={p.id} className="border border-border px-2 py-1.5 text-center" style={{ background: bg }}>
                        {e ? (
                          <div>
                            <div className="font-semibold leading-tight">{e.subject?.code || e.subject?.name}</div>
                            <div className="text-[10px] text-muted-foreground">{e.faculty?.name?.split(" ")[0]}</div>
                            {e.room && <div className="text-[9px] text-muted-foreground">{e.room.code}</div>}
                            <div className="text-[9px] font-medium mt-0.5 opacity-70">{e.entry_type}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/20 text-lg">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="flex gap-4 mt-3 justify-end text-xs">
            {[["Lecture","#dbeafe"],["Lab","#dcfce7"],["Tutorial","#f3e8ff"]].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: c, border:"1px solid #cbd5e1" }}/>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
