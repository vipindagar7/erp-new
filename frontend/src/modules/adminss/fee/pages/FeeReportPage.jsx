// src/modules/adminss/fee/pages/FeeReportPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, BarChart2, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function FeeReportPage() {
  const navigate = useNavigate();
  const [summary,    setSummary]    = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [sessionId,  setSessionId]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [tab, setTab] = useState("summary");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const ses = r.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s => s.is_current);
      if (cur) { setSessionId(cur.id); loadReport(cur.id); }
    }).catch(() => setLoading(false));
  }, []);

  const loadReport = async (sid) => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        axiosInstance.get(EP.fee.feeSummary + `?session_id=${sid}`),
        axiosInstance.get(EP.fee.defaulters  + `?session_id=${sid}`),
      ]);
      setSummary(sRes.data?.data);
      setDefaulters(dRes.data?.data || []);
    } catch { notify.error("Failed to load report"); }
    finally { setLoading(false); }
  };

  const exportDefaulters = () => {
    const rows = defaulters.map(s => {
      const due = s.feePayments?.reduce((sum,p) => sum+(p.due_amount||0), 0) || 0;
      return [s.name, s.roll_no, s.section?.name, due];
    });
    const csv = [["Name","Roll No","Section","Due Amount"],...rows].map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "fee-defaulters.csv";
    a.click();
  };

  const collectionPct = summary?.total_expected > 0
    ? Math.round(summary.total_collected / summary.total_expected * 100) : 0;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate("/admin/fee")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart2 size={18} className="text-primary"/>Fee Report</h1>
        </div>
        <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadReport(e.target.value);}}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button onClick={exportDefaulters} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          <Download size={13}/>Export
        </button>
      </div>

      {/* Collection summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Expected", value:`₹${summary.total_expected?.toLocaleString()}`,  color:"text-foreground" },
            { label:"Collected",      value:`₹${summary.total_collected?.toLocaleString()}`,  color:"text-green-600"  },
            { label:"Pending",        value:`₹${((summary.total_expected||0)-(summary.total_collected||0)).toLocaleString()}`, color:"text-red-500" },
            { label:"Waivers",        value:`₹${summary.total_waivers?.toLocaleString()}`,    color:"text-violet-600" },
          ].map(s=>(
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Collection Progress</span>
            <span className="font-bold text-primary">{collectionPct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{width:`${collectionPct}%`}}/>
          </div>
          <p className="text-xs text-muted-foreground">{summary.paid_count} students fully paid · {summary.pending_count} pending</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[["summary","Collection Summary"],["defaulters","Defaulters"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground"}`}>
            {l} {k==="defaulters"&&defaulters.length>0?`(${defaulters.length})`:""}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div> : (
        <>
          {tab==="defaulters" && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-border bg-muted/20">
                  <tr>{["Student","Roll No","Section","Due Amount","Action"].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {defaulters.length===0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-green-600 font-medium">🎉 No defaulters!</td></tr>}
                  {defaulters.map(s=>{
                    const due = s.feePayments?.reduce((sum,p)=>sum+(p.due_amount||0),0)||0;
                    return (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-medium">{s.name}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{s.roll_no}</td>
                        <td className="px-3 py-2.5">{s.section?.name}</td>
                        <td className="px-3 py-2.5 font-bold text-red-500">₹{due.toLocaleString()}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={()=>navigate(`/admin/fee/student/${s.id}`)} className="text-xs text-primary hover:underline">Collect</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
