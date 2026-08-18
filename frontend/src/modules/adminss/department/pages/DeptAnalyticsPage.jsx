// src/modules/adminss/department/pages/DeptAnalyticsPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart2, Users, GraduationCap, Download, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function DeptAnalyticsPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [dept,     setDept]     = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty,  setFaculty]  = useState([]);
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.departments.byId(id)),
      axiosInstance.get(EP.students.all + `?dept_id=${id}&limit=500`).catch(() => ({ data:{ data:[] } })),
      axiosInstance.get(EP.faculty.list + `?dept_id=${id}&limit=200`).catch(() => ({ data:{ data:[] } })),
      axiosInstance.get(EP.sections.list + `?dept_id=${id}&limit=100`).catch(() => ({ data:{ data:[] } })),
    ]).then(([dRes, sRes, fRes, secRes]) => {
      setDept(dRes.data?.data);
      setStudents(sRes.data?.data || []);
      setFaculty(fRes.data?.data?.faculty || fRes.data?.data || []);
      setSections(secRes.data?.data?.sections || secRes.data?.data || []);
    }).catch(() => notify.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    const rows = students.map(s => [s.name, s.roll_no, s.enrollment_no, s.section?.name, s.semester, s.status]);
    const csv  = [["Name","Roll No","Enrollment","Section","Semester","Status"],...rows].map(r=>r.join(",")).join("\n");
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = `${dept?.name}-analytics.csv`;
    a.click();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  const activeStudents  = students.filter(s => s.status === "ACTIVE").length;
  const activeFaculty   = faculty.filter(f => f.status === "ACTIVE").length;
  const activeSections  = sections.filter(s => s.status !== "INACTIVE").length;

  // Group students by semester
  const bySemester = {};
  students.forEach(s => {
    const sem = s.semester || "Unknown";
    bySemester[sem] = (bySemester[sem] || 0) + 1;
  });

  // Faculty by designation
  const byDesignation = {};
  faculty.forEach(f => {
    const d = f.designation || "Other";
    byDesignation[d] = (byDesignation[d] || 0) + 1;
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/departments/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary"/>Department Analytics</h1>
          <p className="text-sm text-muted-foreground">{dept?.name} · {dept?.code}</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13}/>Export
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Students",  value:students.length,   subLabel:`${activeStudents} active`,   icon:Users,          color:"text-blue-600"   },
          { label:"Total Faculty",   value:faculty.length,    subLabel:`${activeFaculty} active`,    icon:GraduationCap,  color:"text-violet-600" },
          { label:"Sections",        value:sections.length,   subLabel:`${activeSections} active`,   icon:BarChart2,      color:"text-green-600"  },
          { label:"Student:Faculty", value:faculty.length > 0 ? Math.round(students.length/faculty.length) + ":1" : "—", icon:Users, color:"text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <s.icon size={16} className={`${s.color} mb-2`}/>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.subLabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Students by semester */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Students by Semester</p>
          {Object.entries(bySemester).sort(([a],[b]) => +a - +b).map(([sem, count]) => (
            <div key={sem} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Semester {sem}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${students.length > 0 ? count/students.length*100 : 0}%` }}/>
              </div>
            </div>
          ))}
          {Object.keys(bySemester).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
        </div>

        {/* Faculty by designation */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faculty by Designation</p>
          {Object.entries(byDesignation).sort(([,a],[,b]) => b-a).map(([des, count]) => (
            <div key={des} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate max-w-[70%]">{des}</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${faculty.length > 0 ? count/faculty.length*100 : 0}%` }}/>
              </div>
            </div>
          ))}
          {Object.keys(byDesignation).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
        </div>
      </div>

      {/* Sections table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Sections ({sections.length})</p>
        </div>
        <table className="w-full text-xs">
          <thead className="border-b border-border bg-muted/20">
            <tr>{["Section","Semester","Batch","Students","Status"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sections.map(s => (
              <tr key={s.id} className="hover:bg-muted/20">
                <td className="px-3 py-2.5 font-medium">{s.name}</td>
                <td className="px-3 py-2.5">{s.semester}</td>
                <td className="px-3 py-2.5">{s.batch}</td>
                <td className="px-3 py-2.5">{s._count?.students || 0}</td>
                <td className="px-3 py-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${s.status==="ACTIVE"?"bg-green-50 text-green-700":"bg-muted text-muted-foreground"}`}>{s.status||"ACTIVE"}</span>
                </td>
              </tr>
            ))}
            {sections.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No sections</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
