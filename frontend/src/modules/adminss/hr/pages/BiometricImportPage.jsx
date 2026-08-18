// src/modules/adminss/hr/pages/BiometricImportPage.jsx
// ESSL Biometric placeholder — import faculty attendance from CSV
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Info } from "lucide-react";
import { notify } from "../../../../hooks/notify.js";

export default function BiometricImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  const downloadTemplate = () => {
    const csv = "emp_id,date,in_time,out_time,status\nEIT-FAC-001,2025-07-01,09:05,17:30,PRESENT\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "essl-attendance-template.csv";
    a.click();
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={()=>navigate("/admin/hr")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold">ESSL Biometric Import</h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5"/>
        <div className="text-sm text-amber-700 space-y-1">
          <p className="font-semibold">ESSL SDK Integration — Coming Soon</p>
          <p>Direct biometric device sync via ESSL SDK is not yet integrated. For now, export attendance data from your ESSL software as CSV and import it here.</p>
          <p>Format: emp_id, date, in_time, out_time, status</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <p className="text-sm font-medium">Import Attendance from CSV</p>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/40">
          Download CSV Template
        </button>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Upload Attendance CSV</label>
          <input type="file" accept=".csv" onChange={e=>setFile(e.target.files?.[0]||null)}
            className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-medium cursor-pointer"/>
        </div>
        {file && (
          <button onClick={()=>notify.success("Import feature coming soon — ESSL SDK pending")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Upload size={14}/>Import {file.name}
          </button>
        )}
      </div>
    </div>
  );
}
