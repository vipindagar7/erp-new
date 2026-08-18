// src/modules/faculty/pages/FacultyActivityPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { AuditLogs } from "../../../../components/shared/AuditLogs.jsx";
import { notify } from "../../../../hooks/notify.js";

export default function FacultyActivityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]); const [total, setTotal] = useState(0);
  const [name, setName] = useState(""); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosInstance.get(`${EP.faculty.byId(id)}/activity`, { params: { page, limit } });
      const d = r.data?.data; setLogs(d?.logs || []); setTotal(d?.pagination?.total ?? 0);
    } catch { notify.error("Failed"); } finally { setLoading(false); }
  };
  useEffect(() => { axiosInstance.get(EP.faculty.byId(id)).then((r) => setName(r.data?.data?.name || "")); }, [id]);
  useEffect(() => { load(); }, [page]);

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.faculty.detail(id))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></button>
        <div><h1 className="text-xl font-bold">Activity — {name}</h1><p className="text-sm text-muted-foreground">{total} actions logged</p></div>
      </div>
      <AuditLogs logs={logs} total={total} page={page} limit={limit} loading={loading} onPageChange={setPage} isRoot={false} />
    </div>
  );
}
