// src/modules/studentPortal/pages/StudentGroups.jsx
// Student portal — see groups I belong to + their features
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { List, Megaphone, CheckSquare, BarChart3, Bell } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { useSelector } from "react-redux";

export default function StudentGroups() {
  const { user } = useSelector((s) => s.auth);
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For student portal, we list all active groups they're part of
    // Backend should filter by student membership
    axiosInstance.get(EP.groups.list, { params: { limit: 50 } })
      .then((r) => setGroups(r.data?.data?.groups || []))
      .catch(() => notify.error("Failed to load groups"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><List size={18} /></div>
        <div><h1 className="text-xl font-bold">My Groups</h1><p className="text-sm text-muted-foreground">Groups you're a member of</p></div>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
      : groups.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground bg-card border border-border rounded-2xl">You haven't been added to any groups yet.</div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{g.name}</p>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{g.type}</span>
                  </div>
                  {g.description && <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{g._count?.members} members</span>
              </div>
              {/* Quick feature counts */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {g._count?.announcements > 0 && <span className="flex items-center gap-1"><Megaphone size={11} /> {g._count.announcements} announcements</span>}
                {g._count?.tasks         > 0 && <span className="flex items-center gap-1"><CheckSquare size={11} /> {g._count.tasks} tasks</span>}
                {g._count?.polls         > 0 && <span className="flex items-center gap-1"><BarChart3 size={11} /> {g._count.polls} polls</span>}
                {g._count?.notices       > 0 && <span className="flex items-center gap-1"><Bell size={11} /> {g._count.notices} notices</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}