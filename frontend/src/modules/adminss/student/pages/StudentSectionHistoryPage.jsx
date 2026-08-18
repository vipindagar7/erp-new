// src/modules/student/pages/StudentSectionHistoryPage.jsx
// Tracks every section change for every student
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GitBranch, Search, X, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function StudentSectionHistoryPage() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");

  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const load = async () => {
    setLoading(true);
    try {
      // Use audit log filtered by module=student, action contains section
      const params = {
        module: "student",
        ...(studentId && { record_id: studentId }),
        ...(search    && { search }),
        action: "SECTION_CHANGE",
        limit:  200,
      };
      // Try the dedicated endpoint first, fall back to audit
      const r = await axiosInstance.get(EP.audit.list, { params });
      setRecords(r.data?.data?.logs || []);
    } catch { notify.error("Failed to load section history"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [studentId]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><GitBranch size={20} /> Student Section Changes</h1>
        <p className="text-sm text-muted-foreground">{records.length} records</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search student name or email…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={load} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Search</button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Time","Student","From Section","To Section","Changed By","Reason"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {[1,2,3,4,5,6].map((j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
              </tr>
            )) : records.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No section changes found</td></tr>
            ) : records.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-xs font-medium">{r.record_label || r.new_data?.student_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{r.prev_data?.from_section_code || r.prev_data?.section || "None"}</span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="font-mono text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">{r.new_data?.to_section_code || r.new_data?.section || "—"}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.user_email || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.new_data?.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
