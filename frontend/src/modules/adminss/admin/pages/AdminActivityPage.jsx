// src/modules/admin/pages/AdminActivityPage.jsx
// Global activity feed — what all admins have done across the ERP
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";
import { AuditLogs }  from "../../../../components/shared/AuditLogs.jsx";
import { FilterPanel } from "../../../../components/shared/FilterPanel.jsx";
import { notify } from "../../../../hooks/notify.js";

const MODULE_OPTIONS = [
  "student","faculty","admin","superadmin","department","program",
  "branch","section","enrollment","subject","curriculum","feedback","session",
].map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }));

export default function AdminActivityPage() {
  const navigate = useNavigate();
  const { isRoot } = usePageGuard();
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [module,  setModule]  = useState("");
  const [action,  setAction]  = useState("");
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (module) params.module = module;
      if (action) params.action = action;
      const r = await axiosInstance.get(EP.audit.list, { params });
      const d = r.data?.data;
      setLogs(d?.logs || d || []);
      setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load activity"); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); }, [module, action]);
  useEffect(() => { load(); }, [page, module, action]);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.admins.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Activity Feed</h1><p className="text-sm text-muted-foreground">{total} actions logged across the ERP</p></div>
      </div>

      <FilterPanel filters={[
        { key: "module", label: "Module", type: "select", value: module, onChange: setModule, options: MODULE_OPTIONS },
        { key: "action", label: "Action", type: "select", value: action, onChange: setAction,
          options: ["CREATE","UPDATE","DELETE","BLOCK","UNBLOCK","PROMOTE","DEMOTE","DEACTIVATE","RESTORE","RESET_PASSWORD"].map((a) => ({ value: a, label: a })) },
      ]} />

      <AuditLogs logs={logs} total={total} page={page} limit={limit} loading={loading} onPageChange={setPage} isRoot={isRoot} onRollbackSuccess={load} />
    </div>
  );
}
