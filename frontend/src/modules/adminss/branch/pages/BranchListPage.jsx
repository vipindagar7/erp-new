// src/modules/branches/pages/BranchesListPage.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, GitMerge, Upload, Download } from "lucide-react";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "../../../../components/shared/Pagination.jsx";
import { SkeletonRow } from "../../../../components/shared/Skeleton.jsx";

export default function BranchesListPage({ filter }) {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const timer = useRef(null);
  const [bulk, setBulk] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (filter) params.status = filter;
      const r = await axiosInstance.get(EP.branches.list, { params });
      setBranches(r.data?.data?.branches || r.data?.data || []);
      setTotal(r.data?.data?.pagination?.total ?? 0);
    } catch { notify.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => { setPage(1); load(); }, 300); }, [search]);
  useEffect(() => { load(); }, [page]);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">{filter ? `${filter.charAt(0) + filter.slice(1).toLowerCase()} Branches` : "All Branches"}</h1><p className="text-sm text-muted-foreground">{total} branches</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setBulk(b => !b)}>
            <Upload size={13} className="mr-1.5" /> {bulk ? "Hide Bulk" : "Bulk Upload"}
          </Button>
          <Button size="sm" onClick={() => navigate(ROUTES.branches.new)}>
            <Plus size={13} className="mr-1.5" /> New Branch
          </Button>
        </div>
      </div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branches…" className="max-w-xs h-9" />
      {bulk && (
        <BulkUploadPanel
          templateUrl={EP.branches.template}
          uploadUrl={EP.branches.bulkUpload}
          templateName="branch-template.xlsx"
          module="Branch"
          onSuccess={load}
          fields={[
            { label: "name", required: true, notes: "Branch display name" },
            { label: "program_code", required: true, notes: "From Programs reference sheet" },
            { label: "branch_code", required: false, notes: "Auto-generated if blank" },
            { label: "intake_capacity", required: false, notes: "Seats per batch" },
            { label: "has_combined_first_year", required: false, notes: "true/false" },
            { label: "start_session", required: false, notes: "e.g. 2019-20" },
          ]}
        />
      )}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>{["Branch", "Code", "Program", "Department", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : branches.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No branches found</td></tr>
                : branches.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(ROUTES.branches.detail(b.id))}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><GitMerge size={13} className="text-muted-foreground" /><p className="font-medium">{b.name}</p></div></td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{b.code || b.branch_code || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.program?.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.program?.department?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${b.is_active !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {b.is_active !== false ? "Active" : "Discontinued"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); navigate(ROUTES.branches.detail(b.id)); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye size={13} /></button>
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