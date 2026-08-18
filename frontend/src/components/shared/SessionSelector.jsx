// src/components/shared/SessionSelector.jsx
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

export function SessionSelector({ value, onChange, placeholder = "Select session", className }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    axiosInstance.get(EP.sessions.list, { params: { limit: 50 } })
      .then((r) => setSessions(r.data?.data?.sessions || r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={className}>
      <Select value={value || ""} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="h-9 text-sm min-w-[160px]">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={13} className="text-muted-foreground shrink-0" />
            <SelectValue placeholder={loading ? "Loading…" : placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              <span>{s.code || s.name}</span>
              {s.is_current && (
                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Current</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
export default SessionSelector;
