// src/components/shared/ExportButton.jsx
// Reusable export button — drops into any module detail/hub page
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { notify }    from "../../hooks/notify.js";
import { Button }    from "@/components/ui/button";

/**
 * Usage:
 * <ExportButton reportId="students_by_section" filters={{ section_id: id }} label="Export Students" />
 * <ExportButton reportId="faculty_by_dept"     filters={{ dept_id: id }}    label="Export Faculty" />
 * <ExportButton reportId="section_detail"      filters={{ section_id: id }} label="Export Section" />
 */
export default function ExportButton({
  reportId,
  filters = {},
  label    = "Export",
  variant  = "outline",
  size     = "sm",
  className = "",
}) {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([,v]) => v))
      ).toString();
      const url = `/reports/generate/${reportId}${params ? "?" + params : ""}`;
      const r = await axiosInstance.get(url, { responseType:"blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = `${reportId}-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click(); URL.revokeObjectURL(a.href);
      notify.success(`${label} downloaded`);
    } catch { notify.error("Export failed"); }
    finally { setLoading(false); }
  };

  return (
    <Button variant={variant} size={size} disabled={loading} onClick={go} className={className}>
      {loading
        ? <Loader2 size={13} className="mr-1.5 animate-spin" />
        : <Download size={13} className="mr-1.5" />}
      {loading ? "Exporting…" : label}
    </Button>
  );
}
