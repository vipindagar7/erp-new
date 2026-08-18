// src/modules/faculty/pages/FacultyLeavePage.jsx
// Single page — balance + apply + history + transfer + substitution requests
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  ChevronRight, ChevronDown, ChevronUp, Plus, X,
  FileText, ArrowRight, Calendar, RefreshCw, Send,
  Users, Check,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const STATUS_COLORS = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
};
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ── Balance card ───────────────────────────────────────────────
function BalanceCard({ bal }) {
  const pct = bal.total > 0 ? Math.min(100, (bal.used / bal.total) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">{bal.name}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${bal.remaining > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
          }`}>{bal.remaining} left</span>
      </div>
      {bal.balance_required && (
        <>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Used: {bal.used}</span>
            <span>Total: {bal.total}</span>
          </div>
        </>
      )}
      {!bal.balance_required && (
        <p className="text-[10px] text-muted-foreground">No balance limit</p>
      )}
    </div>
  );
}

// ── Transfer modal for a single lecture ───────────────────────
function TransferModal({ lecture, onClose, onDone }) {
  const [facQuery, setFacQuery] = useState("");
  const [facList, setFacList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const searchFaculty = async () => {
    if (!facQuery.trim()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/faculty?q=${facQuery}&limit=10`);
      setFacList(res.data?.data?.faculty || res.data?.data || []);
    } catch { notify.error("Search failed"); }
    finally { setLoading(false); }
  };

  const sendRequest = async () => {
    if (!selected) { notify.error("Select a faculty"); return; }
    setSaving(true);
    try {
      await axiosInstance.post("/api/leave/substitution", {
        entry_id: lecture.entry_id,
        date: lecture.date,
        substitute_faculty_id: selected.id,
        reason: reason || "Leave application",
      });
      notify.success(`Transfer request sent to ${selected.name}`);
      onDone();
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Transfer Lecture</h3>
            <p className="text-xs text-muted-foreground">{lecture.date} · {lecture.period_name} · {lecture.subject_name} · {lecture.section_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X size={14} /></button>
        </div>

        <div className="flex gap-2">
          <input value={facQuery} onChange={e => setFacQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchFaculty()}
            className={inp} placeholder="Search substitute faculty by name…" />
          <button onClick={searchFaculty} disabled={loading}
            className="h-10 px-3 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-60">
            {loading ? <Loader2 size={13} className="animate-spin" /> : "Search"}
          </button>
        </div>

        {facList.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {facList.map(f => (
              <button key={f.id} onClick={() => setSelected(f)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all ${selected?.id === f.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/20"
                  }`}>
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {f.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.designation} · {f.department?.name}</p>
                </div>
                {selected?.id === f.id && <Check size={14} className="text-primary ml-auto" />}
              </button>
            ))}
          </div>
        )}

        <input value={reason} onChange={e => setReason(e.target.value)}
          className={inp} placeholder="Reason (optional)" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted">Cancel</button>
          <button onClick={sendRequest} disabled={saving || !selected}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {saving ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Apply Leave Form ───────────────────────────────────────────
function ApplyForm({ types, onSuccess }) {
  const [form, setForm] = useState({
    leave_type_id: "", from_date: "", to_date: "",
    half_day: false, half_day_period: "MORNING",
    reason: "", documents: [],
  });
  const [lectures, setLectures] = useState([]);
  const [loadingLec, setLoadingLec] = useState(false);
  const [transferModal, setTransferModal] = useState(null);
  const [applying, setApplying] = useState(false);

  const selectedType = types.find(t => t.id === form.leave_type_id);

  // Load lectures when dates change
  useEffect(() => {
    if (!form.from_date || !form.to_date) { setLectures([]); return; }
    setLoadingLec(true);
    axiosInstance.get("/api/leave/lectures", {
      params: { from_date: form.from_date, to_date: form.to_date }
    }).then(r => setLectures(r.data?.data || []))
      .catch(() => setLectures([]))
      .finally(() => setLoadingLec(false));
  }, [form.from_date, form.to_date]);

  const allTransferred = lectures.length === 0 || lectures.every(l => l.transfer_done);
  const pendingCount = lectures.filter(l => !l.transfer_done).length;

  const apply = async () => {
    if (!form.leave_type_id) { notify.error("Select leave type"); return; }
    if (!form.from_date || !form.to_date) { notify.error("Select dates"); return; }
    if (!form.reason.trim()) { notify.error("Enter reason"); return; }
    if (pendingCount > 0) { notify.error(`${pendingCount} lecture(s) transfer pending`); return; }

    setApplying(true);
    try {
      await axiosInstance.post("/api/leave/apply", form);
      notify.success("Leave application submitted");
      onSuccess();
    } catch (e) {
      notify.error(e.response?.data?.message || "Failed");
    } finally { setApplying(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium">Leave Type *</label>
          <select value={form.leave_type_id} onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))} className={inp}>
            <option value="">Select…</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code}){t.requires_document ? " — Attachment Required" : ""}</option>)}
          </select>
          {selectedType?.requires_document && (
            <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle size={11} />Attachment required for this leave type</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">From Date *</label>
          <input type="date" value={form.from_date} onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))} className={inp} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">To Date *</label>
          <input type="date" value={form.to_date} min={form.from_date} onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))} className={inp} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.half_day} onChange={e => setForm(f => ({ ...f, half_day: e.target.checked }))} className="w-4 h-4 accent-primary" />
        Half Day Leave
      </label>

      {form.half_day && (
        <div className="flex gap-2">
          {["MORNING", "AFTERNOON"].map(p => (
            <button key={p} onClick={() => setForm(f => ({ ...f, half_day_period: p }))}
              className={`flex-1 h-9 rounded-lg border text-sm transition-colors ${form.half_day_period === p ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium">Reason *</label>
        <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={2} placeholder="Reason for leave…" />
      </div>

      {/* Lectures to transfer */}
      {(form.from_date && form.to_date) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lectures to Transfer
            </p>
            {loadingLec && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
          </div>

          {lectures.length === 0 && !loadingLec && (
            <div className="text-center py-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle size={18} className="mx-auto text-green-500 mb-1" />
              <p className="text-xs text-green-700">No classes on selected dates 🎉</p>
            </div>
          )}

          {lectures.map((lec, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${lec.transfer_done ? "bg-green-50 border-green-200" :
                lec.substitution ? "bg-amber-50 border-amber-200" :
                  "bg-card border-border"
              }`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{lec.date} · {lec.period_name}</p>
                <p className="text-xs text-muted-foreground">{lec.subject_name} · {lec.section_name}</p>
                {lec.substitution && (
                  <p className={`text-[10px] mt-0.5 font-medium ${lec.transfer_done ? "text-green-600" :
                      lec.substitution.status === "REJECTED" ? "text-red-600" : "text-amber-600"
                    }`}>
                    {lec.transfer_done ? "✓ Transfer accepted" :
                      lec.substitution.status === "REJECTED" ? "✗ Rejected — request again" :
                        "⏳ Waiting for acceptance…"}
                  </p>
                )}
              </div>
              {lec.transfer_done
                ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                : (
                  <button onClick={() => setTransferModal(lec)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 shrink-0">
                    <ArrowRight size={11} />
                    {lec.substitution ? "Re-request" : "Transfer"}
                  </button>
                )
              }
            </div>
          ))}

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} />
              {pendingCount} lecture(s) pending transfer. Get all accepted before applying.
            </div>
          )}
        </div>
      )}

      <button onClick={apply} disabled={applying || pendingCount > 0}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
        {applying ? <><Loader2 size={14} className="animate-spin" />Submitting…</> : <>Submit Leave Application</>}
      </button>

      {transferModal && (
        <TransferModal
          lecture={transferModal}
          onClose={() => setTransferModal(null)}
          onDone={() => {
            setTransferModal(null);
            // Refresh lectures
            if (form.from_date && form.to_date) {
              axiosInstance.get("/api/leave/lectures", {
                params: { from_date: form.from_date, to_date: form.to_date }
              }).then(r => setLectures(r.data?.data || [])).catch(() => { });
            }
          }}
        />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function FacultyLeavePage() {
  const [tab, setTab] = useState("balance"); // balance | apply | history | requests
  const [balances, setBalances] = useState([]);
  const [types, setTypes] = useState([]);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openApp, setOpenApp] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [balRes, typeRes, histRes, pendRes] = await Promise.all([
        axiosInstance.get("/api/leave/balance"),
        axiosInstance.get("/api/leave/types"),
        axiosInstance.get("/api/leave/my"),
        axiosInstance.get("/api/leave/substitution/pending"),
      ]);
      setBalances(balRes.data?.data || []);
      setTypes(typeRes.data?.data || []);
      setHistory(histRes.data?.data || []);
      setPending(pendRes.data?.data || []);
    } catch { notify.error("Failed to load leave data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pendingSubCount = pending.length;

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 size={22} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Clock size={18} className="text-amber-500" />My Leave</h1>
        <button onClick={load} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><RefreshCw size={14} /></button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl">
        {[
          ["balance", "Balance"],
          ["apply", "Apply Leave"],
          ["history", "History"],
          ["requests", `Requests${pendingSubCount > 0 ? ` (${pendingSubCount})` : ""}`],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
            {l}
          </button>
        ))}
      </div>

      {/* Balance Tab */}
      {tab === "balance" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Academic year leave balances</p>
          <div className="grid grid-cols-2 gap-3">
            {balances.map(b => <BalanceCard key={b.leave_type_id} bal={b} />)}
          </div>
          {balances.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No leave types configured. Contact HR.
            </div>
          )}
        </div>
      )}

      {/* Apply Tab */}
      {tab === "apply" && (
        <ApplyForm types={types} onSuccess={() => { load(); setTab("history"); }} />
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="space-y-2">
          {history.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No leave applications yet</div>
          )}
          {history.map(app => (
            <div key={app.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setOpenApp(openApp === app.id ? null : app.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{app.leave_type?.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[app.status] || ""}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(app.from_date).toLocaleDateString("en-IN")} – {new Date(app.to_date).toLocaleDateString("en-IN")}
                    &nbsp;({app.total_days} day{app.total_days !== 1 ? "s" : ""})
                  </p>
                </div>
                {openApp === app.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {openApp === app.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">{app.reason}</p>
                  {app.approvalSteps?.map(s => (
                    <div key={s.id} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${STATUS_COLORS[s.status] || "bg-muted"}`}>
                      <span className="font-medium">{s.approver_role} — {s.approver?.name}</span>
                      <span className="ml-auto">{s.status}</span>
                      {s.remarks && <span>· {s.remarks}</span>}
                    </div>
                  ))}
                  {app.status === "PENDING" && (
                    <button onClick={async () => {
                      try {
                        await axiosInstance.post(`/api/leave/cancel/${app.id}`);
                        notify.success("Cancelled"); load();
                      } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
                    }} className="flex items-center gap-1.5 text-xs text-red-600 hover:underline">
                      <X size={11} />Cancel Application
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Substitution Requests Tab */}
      {tab === "requests" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Faculty requesting you to cover their lectures</p>
          {pending.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No pending requests</div>
          )}
          {pending.map(req => (
            <div key={req.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">
                  {req.original_faculty?.name} → {new Date(req.date).toLocaleDateString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {req.entry?.period_config?.name} · {req.entry?.subject?.name} · {req.entry?.timetable?.section?.name}
                </p>
                {req.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {req.reason}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  try {
                    await axiosInstance.post(`/api/leave/substitution/${req.id}/respond`, { accept: true });
                    notify.success("Accepted"); load();
                  } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
                }} className="flex-1 h-9 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1.5">
                  <Check size={13} />Accept
                </button>
                <button onClick={async () => {
                  const note = prompt("Reason for declining (optional):");
                  try {
                    await axiosInstance.post(`/api/leave/substitution/${req.id}/respond`, { accept: false, note: note || "" });
                    notify.success("Declined"); load();
                  } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
                }} className="flex-1 h-9 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1.5">
                  <X size={13} />Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}