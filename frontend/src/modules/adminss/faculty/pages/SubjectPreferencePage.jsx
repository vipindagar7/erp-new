// src/modules/faculty/pages/SubjectPreferencePage.jsx
// Faculty chooses up to 2 subject preferences per session
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BookOpen, Plus, Loader2, CheckCircle, Clock, X, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";
import { Button }    from "@/components/ui/button";
import { Label }     from "@/components/ui/label";
import SearchSelect  from "../../../../components/shared/SearchSelect.jsx";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

const STATUS_COLOR = {
  PENDING:  "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};
const STATUS_ICON = {
  PENDING:  Clock,
  APPROVED: CheckCircle,
  REJECTED: AlertCircle,
};

export default function SubjectPreferencePage() {
  const user       = useSelector(s => s.auth?.user);
  const facultyId  = user?.faculty?.id;

  const [sessions,  setSessions]  = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [newSubject,setNewSubject]= useState({ subject_id:"", preference:1, _label:"" });
  const [submitting,setSubmitting]= useState(false);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list).then(r => {
      const list = r.data?.data || [];
      setSessions(list);
      const cur  = list.find(s => s.is_current);
      if (cur) setSessionId(cur.id);
    }).catch(() => {});
  }, []);

  const load = () => {
    if (!sessionId || !facultyId) return;
    setLoading(true);
    axiosInstance.get(EP.faculty.subjectRequests, { params:{ session_id:sessionId, faculty_id:facultyId } })
      .then(r => setRequests(r.data?.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [sessionId, facultyId]);

  const submit = async () => {
    if (!newSubject.subject_id) { notify.error("Select a subject"); return; }
    if (!facultyId) { notify.error("Faculty profile not found"); return; }
    setSubmitting(true);
    try {
      await axiosInstance.post(EP.faculty.subjectRequests, {
        faculty_id:  facultyId,
        subject_id:  newSubject.subject_id,
        session_id:  sessionId,
        preference:  newSubject.preference,
      });
      notify.success("Preference submitted — dept admin will review");
      setNewSubject({ subject_id:"", preference:1, _label:"" });
      setAdding(false);
      load();
    } catch (err) { notify.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  const approved  = requests.filter(r => r.status==="APPROVED");
  const pending   = requests.filter(r => r.status==="PENDING");
  const rejected  = requests.filter(r => r.status==="REJECTED");
  const canAddMore= requests.filter(r => r.status!=="REJECTED").length < 2;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <BookOpen size={20} className="text-primary"/>
        <div>
          <h1 className="text-xl font-bold">Subject Preferences</h1>
          <p className="text-sm text-muted-foreground">Request up to 2 subjects to teach this session</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">How it works:</p>
        <p>You can request up to 2 subject preferences per session. Your dept admin will approve or reject each request. Approved subjects are automatically added to your assigned subjects.</p>
      </div>

      {/* Session selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">Session</Label>
        <select value={sessionId} onChange={e => setSessionId(e.target.value)} className={sel + " max-w-xs"}>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.name||s.code}{s.is_current?" (Current)":""}</option>)}
        </select>
      </div>

      {/* Current requests */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-muted-foreground"/></div>
      ) : (
        <div className="space-y-3">
          {requests.length === 0 && !adding && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
              <BookOpen size={28} className="mx-auto text-muted-foreground/20"/>
              <p className="text-sm text-muted-foreground">No preferences submitted for this session</p>
              <p className="text-xs text-muted-foreground/60">You can request up to 2 subjects you'd like to teach</p>
            </div>
          )}

          {requests.map(r => {
            const Icon = STATUS_ICON[r.status] || Clock;
            return (
              <div key={r.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  P{r.preference}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{r.subject?.name}</p>
                  <p className="text-xs text-muted-foreground">{r.subject?.code} · {r.subject?.category}</p>
                  {r.review_note && <p className="text-xs text-muted-foreground italic mt-0.5">"{r.review_note}"</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0 ${STATUS_COLOR[r.status]}`}>
                  <Icon size={10}/>{r.status}
                </span>
              </div>
            );
          })}

          {/* Add preference */}
          {canAddMore && !adding && (
            <Button variant="outline" onClick={() => setAdding(true)} className="w-full">
              <Plus size={13} className="mr-1.5"/>
              Add Preference {requests.filter(r=>r.status!=="REJECTED").length+1}
            </Button>
          )}

          {adding && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Preference {requests.filter(r=>r.status!=="REJECTED").length+1}</p>
                <button onClick={() => { setAdding(false); setNewSubject({ subject_id:"", preference:1, _label:"" }); }}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject *</Label>
                <SearchSelect endpoint={EP.subjects.list} dataPath="subjects" valueKey="id" labelKey="name"
                  subLabelKey="code" value={newSubject.subject_id} selectedLabel={newSubject._label}
                  onChange={(v,opt) => setNewSubject(f => ({ ...f, subject_id:v, _label:opt?.name||"" }))}
                  placeholder="Search subject you want to teach…"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preference Order</Label>
                <div className="flex gap-3">
                  {[1,2].map(p => (
                    <label key={p} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm ${newSubject.preference===p?"border-primary bg-primary/5 font-semibold":"border-border"}`}>
                      <input type="radio" value={p} checked={newSubject.preference===p}
                        onChange={() => setNewSubject(f => ({ ...f, preference:p }))} className="accent-primary"/>
                      Preference {p}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setAdding(false)}>Cancel</Button>
                <Button className="flex-1" disabled={submitting || !newSubject.subject_id} onClick={submit}>
                  {submitting ? <Loader2 size={13} className="mr-1.5 animate-spin"/> : null}Submit Request
                </Button>
              </div>
            </div>
          )}

          {!canAddMore && requests.length > 0 && (
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground text-center">
              You have used both preference slots. Contact your dept admin to modify.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
