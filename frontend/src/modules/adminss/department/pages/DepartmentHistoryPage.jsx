// src/modules/department/pages/DepartmentHistoryPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { AuditLogs } from "../../../../components/shared/AuditLogs.jsx";
import { notify } from "../../../../hooks/notify.js";

export default function DepartmentHistoryPage() {
  const navigate  = useNavigate();
  const { isRoot } = usePageGuard();
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(EP.audit.list, { params: { module: "department", page, limit } });
      const d = r.data?.data;
      setLogs(d?.logs || d || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load history"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.departments.hub)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Department History</h1>
          <p className="text-sm text-muted-foreground">{total} audit entries — every action on every department</p>
        </div>
      </div>

      <AuditLogs
        logs={logs} total={total} page={page} limit={limit}
        loading={loading} onPageChange={setPage}
        isRoot={isRoot} onRollbackSuccess={load} />
    </div>
  );
}