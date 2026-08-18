// src/modules/leave/pages/LeaveListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { SearchBar }   from "../../../../components/shared/SearchBar.jsx";
import { FilterPanel } from "../../../../components/shared/FilterPanel.jsx";
import { Pagination }  from "../../../../components/shared/Pagination.jsx";
import { SkeletonRow } from "../../../../components/shared/Skeleton.jsx";
import StatusBadge     from "../../../../components/shared/StatusBadge.jsx";

const LEAVE_TYPES = ["CASUAL","MEDICAL","EARNED","MATERNITY","PATERNITY","DUTY","UNPAID"].map((t) => ({ value: t, label: t }));
const STATUSES    = ["PENDING","FORWARDED","APPROVED","REJECTED","CANCELLED"].map((s) => ({ value: s, label: s }));

export default function LeaveListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leaves,  setLeaves]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState(searchParams.get("status") || "");
  const [type,    setType]    = useState("");
  const [page,    setPage]    = useState(1);
  const limit = 20;
  const timer = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = { page, limit };
      if (status) p.status     = status;
      if (type)   p.leave_type = type;
      const r = await axiosInstance.get(EP.leave.list, { params: p });
      const d = r.data?.data;
      setLeaves(d?.leaves || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); load(); }, 200);
  }, [status, type]);
  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">All Leave Requests</h1><p className="text-sm text-muted-foreground">{total} requests</p></div>
      </div>

      <FilterPanel filters={[
        { key: "status", label: "Status", type: "select", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: STATUSES },
        { key: "type",   label: "Type",   type: "select", value: type,   onChange: (v) => { setType(v);   setPage(1); }, options: LEAVE_TYPES },
      ]} />

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Faculty","Type","From","To","Days","Status","Level",""].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_,i) => <SkeletonRow key={i} cols={8} />)
            : leaves.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No leave requests found</td></tr>
            : leaves.map((l) => (
              <tr key={l.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.leave.detail(l.id))}>
                <td className="px-4 py-3.5">
                  <p className="font-medium">{l.faculty?.name}</p>
                  <p className="text-xs text-muted-foreground">{l.faculty?.department?.name}</p>
                </td>
                <td className="px-4 py-3.5"><span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">{l.leave_type}</span></td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{new Date(l.from_date).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">{new Date(l.to_date).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3.5 text-center font-medium">{l.total_days}</td>
                <td className="px-4 py-3.5"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">Level {l.current_level}</td>
                <td className="px-4 py-3.5">
                  <button onClick={(e) => { e.stopPropagation(); navigate(ROUTES.leave.detail(l.id)); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
    </div>
  );
}
