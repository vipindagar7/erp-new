// src/modules/adminss/holiday/pages/HolidayPage.jsx
import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Loader2, Edit2, X, Save } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

const sel = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const TYPES   = ["NATIONAL","STATE","LOCAL","INSTITUTE","OPTIONAL"];
const SCOPES  = ["ALL","DEPT","SECTION"];
const TYPE_COLOR = {
  NATIONAL:"bg-red-100 text-red-700", STATE:"bg-orange-100 text-orange-700",
  LOCAL:"bg-amber-100 text-amber-700", INSTITUTE:"bg-blue-100 text-blue-700",
  OPTIONAL:"bg-gray-100 text-gray-600",
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = d => {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
};

// Preset national holidays for quick add
const PRESET_HOLIDAYS = [
  { name:"Republic Day",          date:"01-26", type:"NATIONAL" },
  { name:"Holi",                  date:"03-24", type:"STATE"    },
  { name:"Good Friday",           date:"04-18", type:"NATIONAL" },
  { name:"Independence Day",      date:"08-15", type:"NATIONAL" },
  { name:"Gandhi Jayanti",        date:"10-02", type:"NATIONAL" },
  { name:"Diwali",                date:"10-20", type:"STATE"    },
  { name:"Christmas",             date:"12-25", type:"NATIONAL" },
  { name:"New Year",              date:"01-01", type:"NATIONAL" },
  { name:"Eid ul-Fitr",           date:"",      type:"NATIONAL" },
  { name:"Eid ul-Adha",           date:"",      type:"NATIONAL" },
];

function HolidayModal({ holiday, sessions, onClose, onSave }) {
  const [form, setForm] = useState({
    name:               holiday?.name               || "",
    date:               holiday?.date?.slice(0,10)  || "",
    type:               holiday?.type               || "INSTITUTE",
    scope:              holiday?.scope              || "ALL",
    is_half_day:        holiday?.is_half_day        || false,
    affects_attendance: holiday?.affects_attendance !== false,
    affects_leave:      holiday?.affects_leave      || false,
    description:        holiday?.description        || "",
    session_id:         holiday?.session_id         || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name||!form.date) { notify.error("Name and date required"); return; }
    setSaving(true);
    try {
      if (holiday?.id) {
        await axiosInstance.patch(`/holidays/${holiday.id}`, form);
        notify.success("Updated");
      } else {
        await axiosInstance.post("/holidays", form);
        notify.success("Holiday added");
      }
      onSave();
    } catch(e){ notify.error(e.response?.data?.message||"Failed"); }
    finally{ setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{holiday?"Edit Holiday":"Add Holiday"}</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Diwali, Republic Day…"/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date *</Label>
            <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} className={sel}>
              {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Scope</Label>
            <select value={form.scope} onChange={e=>setForm(f=>({...f,scope:e.target.value}))} className={sel}>
              {SCOPES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Session (optional)</Label>
            <select value={form.session_id} onChange={e=>setForm(f=>({...f,session_id:e.target.value}))} className={sel}>
              <option value="">All sessions</option>
              {sessions.map(s=><option key={s.id} value={s.id}>{s.name||s.code}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          {[
            ["is_half_day",       "Half day holiday"],
            ["affects_attendance","Attendance not counted on this day"],
            ["affects_leave",     "Leave on this day is not deducted"],
          ].map(([k,l])=>(
            <label key={k} className="flex items-center gap-2 cursor-pointer text-sm p-2 rounded-lg hover:bg-muted/20">
              <input type="checkbox" checked={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.checked}))} className="w-4 h-4 accent-primary"/>
              {l}
            </label>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Optional description"/>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={save}>
            {saving?<Loader2 size={13} className="mr-1.5 animate-spin"/>:<Save size={13} className="mr-1.5"/>}Save
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HolidayPage() {
  const [holidays, setHolidays] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [year,     setYear]     = useState(new Date().getFullYear().toString());
  const [filter,   setFilter]   = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get(`/holidays?year=${year}`),
      axiosInstance.get("/sessions?limit=10").catch(()=>({data:{data:[]}})),
    ]).then(([hRes, sRes]) => {
      setHolidays(hRes.data?.data || []);
      setSessions(sRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [year]);

  const deleteHoliday = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await axiosInstance.delete(`/holidays/${id}`); notify.success("Deleted"); load(); }
    catch { notify.error("Failed"); }
  };

  const addPresets = async () => {
    const yr = parseInt(year);
    const toAdd = PRESET_HOLIDAYS.filter(p => p.date).map(p => ({
      name: p.name,
      date: `${yr}-${p.date}`,
      type: p.type,
      affects_attendance: true,
    }));
    try {
      const r = await axiosInstance.post("/holidays/bulk", { holidays: toAdd });
      notify.success(`${r.data?.data?.filter(d=>!d.error).length} holidays added`);
      load();
    } catch { notify.error("Failed"); }
  };

  const filtered = holidays.filter(h =>
    !filter || h.name.toLowerCase().includes(filter.toLowerCase()) || h.type.includes(filter.toUpperCase())
  );

  // Group by month
  const byMonth = {};
  filtered.forEach(h => {
    const m = new Date(h.date).getMonth();
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(h);
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2"><Calendar size={20} className="text-primary"/>
          <div>
            <h1 className="text-xl font-bold">Holiday Master</h1>
            <p className="text-sm text-muted-foreground">Attendance not counted on holidays</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addPresets}>Add National Holidays</Button>
          <Button size="sm" onClick={() => setModal("new")}><Plus size={13} className="mr-1.5"/>Add Holiday</Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <strong>How it works:</strong> When a date is marked as holiday with "Attendance not counted", student & faculty attendance is automatically excluded from percentage calculations. "Leave not deducted" means CL/EL won't be consumed for that date.
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <select value={year} onChange={e=>setYear(e.target.value)} className="h-9 px-3 rounded-lg border border-input bg-background text-sm w-28">
          {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        <Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search…" className="h-9 w-48"/>
        <span className="text-xs text-muted-foreground">{holidays.length} holidays in {year}</span>
      </div>

      {loading ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground"/></div> : (
        <div className="space-y-4">
          {Object.entries(byMonth).sort(([a],[b])=>+a-+b).map(([month, hs]) => (
            <div key={month}>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{MONTHS[month]}</p>
              <div className="space-y-2">
                {hs.map(h=>(
                  <div key={h.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
                    <div className="w-12 h-12 rounded-xl bg-muted flex flex-col items-center justify-center shrink-0">
                      <p className="text-sm font-bold leading-none">{new Date(h.date).getDate()}</p>
                      <p className="text-[10px] text-muted-foreground">{MONTHS[new Date(h.date).getMonth()]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{h.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLOR[h.type]||"bg-muted text-muted-foreground"}`}>{h.type}</span>
                        {h.is_half_day && <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">Half Day</span>}
                        {h.affects_attendance && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Attendance excused</span>}
                        {h.affects_leave && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">✓ Leave not deducted</span>}
                      </div>
                      {h.description && <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">Scope: {h.scope}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setModal(h)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12}/></button>
                      <button onClick={() => deleteHoliday(h.id, h.name)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!Object.keys(byMonth).length && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3">
              <Calendar size={28} className="mx-auto text-muted-foreground/20"/>
              <p className="text-sm text-muted-foreground">No holidays in {year}</p>
              <Button variant="outline" size="sm" onClick={addPresets}>Add National Holidays</Button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <HolidayModal
          holiday={modal==="new" ? null : modal}
          sessions={sessions}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}