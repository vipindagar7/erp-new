// src/modules/faculty/pages/FacultySearchPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Search, X, ArrowLeft } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { fetchDepartments } from "../../../../redux/academic/academicSlice.js";
import { notify } from "../../../../hooks/notify.js";

const DESIGNATIONS   = ["Professor","Associate Professor","Assistant Professor","Lecturer","Lab Assistant","HOD","Visiting Faculty"];
const EMPLOYEE_TYPES = ["PERMANENT","CONTRACT","VISITING","PART_TIME"];
const GENDERS        = ["MALE","FEMALE","OTHER"];

const sel = () => "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

export default function FacultySearchPage() {
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const departments = useSelector((s) => s.academic?.departments?.list ?? []);

  const [query, setQuery]     = useState("");
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => { if (!departments.length) dispatch(fetchDepartments({ limit: 200 })); }, []);

  const setFilter = (k, v) => setFilters((p) => ({ ...p, [k]: v || undefined }));

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (query) params.search = query;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const r = await axiosInstance.get(EP.faculty.list, { params });
      setResults(r.data?.data?.faculty || r.data?.faculty || []);
      setTotal(r.data?.data?.pagination?.total || 0);
      setSearched(true);
    } catch { notify.error("Search failed"); }
    finally { setLoading(false); }
  };

  const activeCount = Object.values(filters).filter(Boolean).length + (query ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/faculty")}
          className="h-9 w-9 rounded-lg border border-input hover:bg-muted flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Search Faculty</h1>
          <p className="text-sm text-muted-foreground">Advanced search and filter</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Filter panel */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 lg:col-span-1">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Name, emp ID, email…"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {[
            { key: "dept_id", label: "Department", options: departments.map((d) => ({ value: d.id, label: d.name })) },
            { key: "designation", label: "Designation", options: DESIGNATIONS.map((d) => ({ value: d, label: d })) },
            { key: "employee_type", label: "Employee Type", options: EMPLOYEE_TYPES.map((e) => ({ value: e, label: e })) },
            { key: "gender", label: "Gender", options: GENDERS.map((g) => ({ value: g, label: g })) },
          ].map(({ key, label, options }) => (
            <div key={key} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <select className={sel()} value={filters[key] || ""} onChange={(e) => setFilter(key, e.target.value)}>
                <option value="">All</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}

          <div className="space-y-2 pt-2 border-t border-border">
            <button onClick={handleSearch}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
              Search
            </button>
            {activeCount > 0 && (
              <button onClick={() => { setQuery(""); setFilters({}); setSearched(false); }}
                className="w-full h-9 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted flex items-center justify-center gap-1.5">
                <X size={13} /> Reset ({activeCount})
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-3">
          {!searched ? (
            <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-2xl">
              <Search size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Set filters and click Search</p>
            </div>
          ) : loading ? (
            <div className="text-center py-16"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{total} results</p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {results.length === 0
                  ? <div className="text-center py-12 text-sm text-muted-foreground">No faculty found</div>
                  : results.map((f) => (
                    <button key={f.id} onClick={() => navigate(`/admin/faculty/${f.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 text-sm font-bold shrink-0">
                        {f.photo_url ? <img src={f.photo_url} alt="" className="w-full h-full object-cover rounded-full" /> : f.name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.designation} · {f.department?.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono text-muted-foreground">{f.emp_id || "—"}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${f.user?.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {f.user?.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </div>
                    </button>
                  ))
                }
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
