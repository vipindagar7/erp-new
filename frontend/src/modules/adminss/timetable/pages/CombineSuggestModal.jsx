// src/modules/adminss/timetable/pages/CombineSuggestModal.jsx
// Shows when same faculty+subject exists in multiple sections for same slot
import { useState } from "react";
import { Users, Link, Unlink, X, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CombineSuggestModal({ suggestion, onCombine, onSkip, onClose }) {
  const [selected, setSelected] = useState(
    suggestion?.combinable?.map(s=>s.section_id)||[]
  );

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link size={16} className="text-primary"/>
            <h3 className="font-semibold">Combine Classes?</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><X size={14}/></button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          Same faculty and subject found in {suggestion?.suggestions?.length} sections for this time slot. You can combine them into one shared lecture.
        </div>

        <div className="space-y-2">
          {suggestion?.suggestions?.map(s=>(
            <label key={s.section_id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selected.includes(s.section_id) && !s.slot_taken
                  ? "border-primary bg-primary/5"
                  : s.slot_taken
                    ? "border-border opacity-50 cursor-not-allowed"
                    : "border-border hover:bg-muted/20"
              }`}>
              <input type="checkbox"
                checked={selected.includes(s.section_id)}
                disabled={s.slot_taken}
                onChange={()=>toggle(s.section_id)}
                className="w-4 h-4 accent-primary shrink-0"/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{s.section_name}</span>
                  <span className="text-xs text-muted-foreground">{s.branch} · Sem {s.semester}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Users size={10} className="text-muted-foreground"/>
                  <span className="text-xs text-muted-foreground">{s.student_count} students</span>
                  {s.slot_taken && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      Slot already taken
                    </span>
                  )}
                </div>
              </div>
              {selected.includes(s.section_id) && !s.slot_taken && (
                <CheckCircle size={14} className="text-primary shrink-0"/>
              )}
            </label>
          ))}
        </div>

        {selected.length > 1 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-green-700">
            <Users size={14}/>
            <span>Combined class: <strong>{suggestion?.suggestions?.filter(s=>selected.includes(s.section_id)).reduce((sum,s)=>sum+s.student_count,0)}</strong> students total</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onSkip}>
            <Unlink size={13} className="mr-1.5"/>Keep Separate
          </Button>
          <Button className="flex-1" disabled={selected.length < 2} onClick={()=>onCombine(selected)}>
            <Link size={13} className="mr-1.5"/>Combine {selected.length} Sections
          </Button>
        </div>
      </div>
    </div>
  );
}