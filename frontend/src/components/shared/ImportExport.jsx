// src/components/shared/ImportExport.jsx
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploader } from "./FileUploader.jsx";
import axiosInstance from "../../lib/axios.js";
import { notify } from "../../hooks/notify.js";

export function ImportExport({ templateUrl, uploadUrl, templateName = "template.xlsx", title = "Import / Export", hint, onSuccess }) {
  const downloadTemplate = async () => {
    try {
      const r = await axiosInstance.get(templateUrl, { responseType: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(r.data);
      a.download = templateName;
      a.click();
    } catch { notify.error("Failed to download template"); }
  };

  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await axiosInstance.post(uploadUrl, fd, { headers: { "Content-Type": "multipart/form-data" } });
    onSuccess?.();
    return r.data?.data;
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download size={13} className="mr-1.5" /> Download Template
        </Button>
      </div>
      <FileUploader hint={hint} onUpload={handleUpload} accept=".xlsx,.xls" />
    </div>
  );
}
export default ImportExport;
