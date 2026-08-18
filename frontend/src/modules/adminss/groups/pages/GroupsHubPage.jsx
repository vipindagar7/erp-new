// src/modules/groups/pages/GroupHubPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, Plus, Activity, Calendar, CheckSquare, Users, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { Button } from "@/components/ui/button";

export default function GroupHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axiosInstance.get(EP.groups.stats).then((r) => setStats(r.data?.data)).catch(() => {});
  }, []);

  const STAT_CARDS = [
    { label: "Total Groups",  value: stats?.total,    color: "blue" },
    { label: "Active",        value: stats?.active,   color: "green" },
    { label: "Inactive",      value: stats?.inactive, color: "gray" },
  ];

  const TYPE_LINKS = ["EVENT","FEST","SPORTS","COMMITTEE","CLUB","OTHER"].map((t) => ({
    label: t.charAt(0) + t.slice(1).toLowerCase(),
    path: `${ROUTES.groups.list}?type=${t}`,
  }));

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><List size={20} /></div>
          <div><h1 className="text-2xl font-bold">Special Groups</h1><p className="text-sm text-muted-foreground">Student groups with 7 collaborative features</p></div>
        </div>
        <Button onClick={() => navigate(ROUTES.groups.new)}><Plus size={14} className="mr-1.5" /> Create Group</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 text-${color}-600`}>{value ?? <Loader2 size={16} className="animate-spin inline" />}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TYPE_LINKS.map(({ label, path }) => (
          <button key={label} onClick={() => navigate(path)} className="bg-card border border-border rounded-xl p-3 text-left hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <Users size={14} className="text-muted-foreground" /><span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Features</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {["📢 Announcements — pin and notify all members","📅 Attendance Requests — exemption requests for events","✅ Tasks — assign and track group activities","📊 Polls — single/multiple choice with live results","📁 File Sharing — share documents and links","📋 Notices — formal mandatory notices","🚪 Room Bookings — request venue with admin approval"].map((f) => (
            <div key={f} className="flex items-start gap-1.5">{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}