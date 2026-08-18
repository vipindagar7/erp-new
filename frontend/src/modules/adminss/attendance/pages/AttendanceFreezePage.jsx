// src/modules/adminss/attendance/pages/AttendanceFreezePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Unlock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function AttendanceFreezePage() {
  const navigate = useNavigate();
  const [freezeRules, setFreezeRules] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sessions,    setSessions]    = useState([]);
  const [sessionId,   setSessionId]   = useState("");
  const [acting,      setActing]      = useState("");

  useEffect(() => {
    axiosInstance.get(EP.sessions.list)
      .then(r => {
        const ses = r.data?.data || [];
        setSessions(ses);
        const cur = ses.find(s => s.is_current);
        if (cur) { setSessionId(cur.id); loadFreezeRules(cur.id); }
      }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadFreezeRules = async (sid) => {
    try {
      const res = await axiosInstance.get(`/api/attendance/freeze?session_id=${sid}`).catch(() => ({ data: { data: [] } }));
      setFreezeRules(res.data?.data || []);
    } catch {}
  };

  const freeze = async (scope, scopeId) => {
    setActing(scope + (scopeId||""));
    try {
      await axiosInstance.post("/api/attendance/freeze", {
        session_id: sessionId, scope, scope_id: scopeId, is_frozen: true, notes: "Manual freeze by admin"
      });
      notify.success("Attendance frozen");
      loadFreezeRules(sessionId);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActing(""); }
  };

  const unfreeze = async (ruleId) => {
    setActing(ruleId);
    try {
      await axiosInstance.patch(`/api/attendance/freeze/${ruleId}`, { is_frozen: false });
      notify.success("Attendance unfrozen");
      loadFreezeRules(sessionId);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setActing(""); }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/attendance")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2"><Lock size={18} className="text-primary"/>Attendance Freeze</h1>
          <p className="text-sm text-muted-foreground">Auto-freeze runs daily at 12:00 AM. Manually freeze/unfreeze here.</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
        <AlertCircle size={14} className="shrink-0 mt-0.5"/>
        <span>Frozen attendance cannot be modified by faculty. Only admin can unfreeze. Auto-freeze runs every night at midnight.</span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session</p>
        <select value={sessionId} onChange={e => { setSessionId(e.target.value); loadFreezeRules(e.target.value); }}
          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Quick freeze actions */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button onClick={() => freeze("INSTITUTE")} disabled={!!acting}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-60">
            {acting==="INSTITUTE" ? <Loader2 size={13} className="animate-spin"/> : <Lock size={13}/>}
            Freeze Institute-wide
          </button>
          <button onClick={() => freeze("DEPARTMENT")} disabled={!!acting}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 disabled:opacity-60">
            {acting==="DEPARTMENT" ? <Loader2 size={13} className="animate-spin"/> : <Lock size={13}/>}
            Freeze by Department
          </button>
          <button onClick={() => freeze("SECTION")} disabled={!!acting}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 disabled:opacity-60">
            {acting==="SECTION" ? <Loader2 size={13} className="animate-spin"/> : <Lock size={13}/>}
            Freeze by Section
          </button>
        </div>
      </div>

      {/* Current freeze rules */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Current Freeze Rules ({freezeRules.length})</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
        ) : freezeRules.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No freeze rules set</div>
        ) : (
          <div className="divide-y divide-border">
            {freezeRules.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full ${r.is_frozen ? "bg-red-500" : "bg-green-500"}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.scope}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.is_frozen ? `Frozen ${r.frozen_at ? new Date(r.frozen_at).toLocaleString("en-IN") : ""}` : "Active (not frozen)"}
                    {r.notes && ` · ${r.notes}`}
                  </p>
                </div>
                {r.is_frozen ? (
                  <button onClick={() => unfreeze(r.id)} disabled={acting===r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60">
                    {acting===r.id ? <Loader2 size={11} className="animate-spin"/> : <Unlock size={11}/>}
                    Unfreeze
                  </button>
                ) : (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle size={12}/>Active</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
