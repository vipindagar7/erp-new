// src/modules/adminss/training/pages/TrainingCreatePage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, GraduationCap } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { notify }    from "../../../../hooks/notify.js";

const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const F = ({ label, required, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      {hint && <span className="text-muted-foreground font-normal ml-1">({hint})</span>}
    </label>
    {children}
  </div>
);
const G2 = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>;
const G3 = ({ children }) => <div className="grid grid-cols-3 gap-3">{children}</div>;
const Sec = ({ title, children }) => (
  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
    {children}
  </div>
);
const Toggle = ({ label, desc, checked, onChange }) => (
  <label className="flex items-start gap-3 cursor-pointer p-3 bg-muted/20 rounded-xl border border-border">
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 mt-0.5 accent-primary shrink-0"/>
    <div>
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  </label>
);

const TABS = ["Basic", "Dates", "Fee", "Attendance", "Elective"];

const DEFAULT = {
  title: "", code: "", description: "", type: "MANDATORY", mode: "OFFLINE",
  dept_id: "", venue: "", online_link: "", room_id: "", total_hours: "",
  start_date: "", end_date: "", elective_deadline: "", fee_due_date: "",
  has_fee: false, fee_amount: "", refund_on_completion: false, refund_on_attendance: false,
  refund_attendance_pct: 75, refund_policy: "",
  attendance_unit_type: "REGULAR", extra_attendance_units: 0, attendance_pct_required: 75,
  max_enrollments: "", tags: "",
};

export default function TrainingCreatePage() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const isEdit     = !!id;

  const [tab,     setTab]   = useState("Basic");
  const [form,    setForm]  = useState(DEFAULT);
  const [depts,   setDepts] = useState([]);
  const [rooms,   setRooms] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const loaders = [
      axiosInstance.get(EP.departments.list + "?limit=100"),
      axiosInstance.get("/rooms?limit=100").catch(() => ({ data: { data: [] } })),
    ];
    if (isEdit) loaders.push(axiosInstance.get(EP.training.byId(id)));

    Promise.all(loaders).then(([dRes, rRes, tRes]) => {
      setDepts(dRes.data?.data?.departments || dRes.data?.data || []);
      setRooms(rRes.data?.data?.rooms || rRes.data?.data || []);
      if (isEdit && tRes) {
        const t = tRes.data?.data;
        setForm({
          title: t.title || "", code: t.code || "", description: t.description || "",
          type: t.type || "MANDATORY", mode: t.mode || "OFFLINE",
          dept_id: t.dept_id || "", venue: t.venue || "", online_link: t.online_link || "",
          room_id: t.room_id || "", total_hours: t.total_hours || "",
          start_date: t.start_date?.slice(0,10) || "", end_date: t.end_date?.slice(0,10) || "",
          elective_deadline: t.elective_deadline?.slice(0,10) || "",
          fee_due_date: t.fee_due_date?.slice(0,10) || "",
          has_fee: t.has_fee || false, fee_amount: t.fee_amount || "",
          refund_on_completion: t.refund_on_completion || false,
          refund_on_attendance: t.refund_on_attendance || false,
          refund_attendance_pct: t.refund_attendance_pct || 75,
          refund_policy: t.refund_policy || "",
          attendance_unit_type: t.attendance_unit_type || "REGULAR",
          extra_attendance_units: t.extra_attendance_units || 0,
          attendance_pct_required: t.attendance_pct_required || 75,
          max_enrollments: t.max_enrollments || "",
          tags: t.tags?.join(", ") || "",
        });
      }
    }).catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = k => e => {
    const v = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm(f => ({ ...f, [k]: v }));
  };

  const save = async () => {
    if (!form.title)      { notify.error("Title required");      setTab("Basic"); return; }
    if (!form.start_date) { notify.error("Start date required"); setTab("Dates"); return; }
    if (!form.end_date)   { notify.error("End date required");   setTab("Dates"); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        total_hours:            form.total_hours        ? parseFloat(form.total_hours)        : null,
        fee_amount:             form.fee_amount         ? parseFloat(form.fee_amount)          : 0,
        max_enrollments:        form.max_enrollments    ? parseInt(form.max_enrollments)       : null,
        extra_attendance_units: parseInt(form.extra_attendance_units) || 0,
        attendance_pct_required:parseFloat(form.attendance_pct_required) || 75,
        refund_attendance_pct:  parseFloat(form.refund_attendance_pct)   || 75,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        start_date:          form.start_date         || null,
        end_date:            form.end_date           || null,
        elective_deadline:   form.elective_deadline  || null,
        fee_due_date:        form.fee_due_date       || null,
        dept_id:             form.dept_id            || null,
        room_id:             form.room_id            || null,
      };

      if (isEdit) {
        await axiosInstance.patch(EP.training.update(id), payload);
        notify.success("Training updated");
        navigate(`/admin/training/${id}`);
      } else {
        const res = await axiosInstance.post(EP.training.create, payload);
        notify.success("Training created");
        navigate(`/admin/training/${res.data?.data?.id}`);
      }
    } catch (e) {
      notify.error(e.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(isEdit ? `/admin/training/${id}` : "/admin/training")}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex-1 flex items-center gap-2">
          <GraduationCap size={18} className="text-primary"/>
          {isEdit ? "Edit Training" : "New Training"}
        </h1>
        <button disabled={saving} onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Basic ── */}
      {tab === "Basic" && (
        <div className="space-y-4">
          <Sec title="Identity">
            <F label="Title" required>
              <input className={inp} value={form.title} onChange={set("title")} placeholder="e.g. Python for Beginners"/>
            </F>
            <G2>
              <F label="Code" hint="auto if blank">
                <input className={inp} value={form.code} onChange={set("code")} placeholder="TRN-2024-001"/>
              </F>
              <F label="Department">
                <select className={sel} value={form.dept_id} onChange={set("dept_id")}>
                  <option value="">All / Institute-wide</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </F>
            </G2>
            <F label="Description">
              <textarea className={inp + " h-20 py-2 resize-none"} value={form.description} onChange={set("description")}
                placeholder="What will students learn? Goals, outcomes…"/>
            </F>
            <G2>
              <F label="Type">
                <select className={sel} value={form.type} onChange={set("type")}>
                  <option value="MANDATORY">Mandatory — all assigned must complete</option>
                  <option value="ELECTIVE">Elective — students choose</option>
                  <option value="OPTIONAL">Optional — voluntary</option>
                </select>
              </F>
              <F label="Mode">
                <select className={sel} value={form.mode} onChange={set("mode")}>
                  {["ONLINE","OFFLINE","HYBRID","WORKSHOP","SEMINAR","INTERNSHIP","GUEST_LECTURE","BOOTCAMP"].map(m => (
                    <option key={m} value={m}>{m.replace(/_/g," ")}</option>
                  ))}
                </select>
              </F>
            </G2>
            <F label="Tags" hint="comma separated">
              <input className={inp} value={form.tags} onChange={set("tags")} placeholder="python, beginner, coding"/>
            </F>
          </Sec>
          <Sec title="Location">
            <G2>
              <F label="Venue / Location">
                <input className={inp} value={form.venue} onChange={set("venue")} placeholder="Seminar Hall A"/>
              </F>
              <F label="Room (from master)">
                <select className={sel} value={form.room_id} onChange={set("room_id")}>
                  <option value="">Select room…</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                </select>
              </F>
            </G2>
            {["ONLINE","HYBRID"].includes(form.mode) && (
              <F label="Online Link">
                <input className={inp} value={form.online_link} onChange={set("online_link")} placeholder="https://meet.google.com/..."/>
              </F>
            )}
          </Sec>
        </div>
      )}

      {/* ── Dates ── */}
      {tab === "Dates" && (
        <Sec title="Schedule">
          <G2>
            <F label="Start Date" required>
              <input className={inp} type="date" value={form.start_date} onChange={set("start_date")}/>
            </F>
            <F label="End Date" required>
              <input className={inp} type="date" value={form.end_date} onChange={set("end_date")}/>
            </F>
          </G2>
          <F label="Total Hours" hint="optional">
            <input className={inp} type="number" min="0" value={form.total_hours} onChange={set("total_hours")} placeholder="20"/>
          </F>
          {form.type === "ELECTIVE" && (
            <F label="Enrollment Deadline" hint="last date to enroll">
              <input className={inp} type="date" value={form.elective_deadline} onChange={set("elective_deadline")}/>
            </F>
          )}
        </Sec>
      )}

      {/* ── Fee ── */}
      {tab === "Fee" && (
        <div className="space-y-4">
          <Sec title="Fee Configuration">
            <Toggle label="This training has a fee" desc="Students must pay to enroll"
              checked={form.has_fee} onChange={v => setForm(f => ({ ...f, has_fee: v }))}/>
            {form.has_fee && (
              <>
                <G2>
                  <F label="Fee Amount (₹)" required>
                    <input className={inp} type="number" min="0" value={form.fee_amount} onChange={set("fee_amount")} placeholder="500"/>
                  </F>
                  <F label="Fee Due Date">
                    <input className={inp} type="date" value={form.fee_due_date} onChange={set("fee_due_date")}/>
                  </F>
                </G2>
                <F label="Refund Policy" hint="text description">
                  <textarea className={inp + " h-16 py-2 resize-none"} value={form.refund_policy} onChange={set("refund_policy")}
                    placeholder="Describe refund conditions…"/>
                </F>
              </>
            )}
          </Sec>
          {form.has_fee && (
            <Sec title="Refund Conditions">
              <Toggle label="Refund on completion"
                desc="Student gets refund if they complete the training"
                checked={form.refund_on_completion}
                onChange={v => setForm(f => ({ ...f, refund_on_completion: v }))}/>
              <Toggle label="Refund on attendance"
                desc="Refund if student meets minimum attendance percentage"
                checked={form.refund_on_attendance}
                onChange={v => setForm(f => ({ ...f, refund_on_attendance: v }))}/>
              {form.refund_on_attendance && (
                <F label="Minimum Attendance % for Refund">
                  <input className={inp} type="number" min="0" max="100" value={form.refund_attendance_pct}
                    onChange={set("refund_attendance_pct")} placeholder="75"/>
                </F>
              )}
            </Sec>
          )}
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === "Attendance" && (
        <div className="space-y-4">
          <Sec title="Attendance Tracking">
            <F label="Attendance Type">
              <select className={sel} value={form.attendance_unit_type} onChange={set("attendance_unit_type")}>
                <option value="REGULAR">Regular — counts as normal class attendance</option>
                <option value="EXTRA">Extra — bonus attendance units granted</option>
                <option value="BOTH">Both — regular + extra units</option>
              </select>
            </F>
            {["EXTRA","BOTH"].includes(form.attendance_unit_type) && (
              <F label="Extra Attendance Units" hint="units granted on completion">
                <input className={inp} type="number" min="0" value={form.extra_attendance_units}
                  onChange={set("extra_attendance_units")} placeholder="5"/>
              </F>
            )}
            <F label="Minimum Attendance % Required" hint="to mark student as completed">
              <input className={inp} type="number" min="0" max="100" value={form.attendance_pct_required}
                onChange={set("attendance_pct_required")} placeholder="75"/>
            </F>
          </Sec>
        </div>
      )}

      {/* ── Elective ── */}
      {tab === "Elective" && (
        <Sec title="Enrollment Limit">
          <p className="text-xs text-muted-foreground">Only relevant for ELECTIVE and OPTIONAL trainings. Leave blank for unlimited.</p>
          <F label="Max Enrollments" hint="leave blank for unlimited">
            <input className={inp} type="number" min="1" value={form.max_enrollments}
              onChange={set("max_enrollments")} placeholder="50"/>
          </F>
        </Sec>
      )}

      {/* Bottom save */}
      <div className="flex justify-end pt-2">
        <button disabled={saving} onClick={save}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Training"}
        </button>
      </div>
    </div>
  );
}
