// src/modules/programs/pages/ProgramBulkPage.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";

const FIELDS = [
  { label: "name",             required: true,  notes: "Program display name e.g. B.Tech Computer Science" },
  { label: "dept_code",        required: true,  notes: "Department code from the Departments reference sheet" },
  { label: "code",             required: false, notes: "Auto-generated if blank. Must be unique." },
  { label: "degree_type",      required: false, notes: "e.g. B.Tech, M.Tech, BCA, MCA, B.Sc" },
  { label: "max_semesters",    required: false, notes: "Total semesters e.g. 8" },
  { label: "duration_years",   required: false, notes: "e.g. 4" },
  { label: "intake_capacity",  required: false, notes: "Seats per year" },
  { label: "accreditation",    required: false, notes: "e.g. NBA, NAAC-A" },
  { label: "description",      required: false, notes: "Free text" },
];

export default function ProgramBulkPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.programs.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center"><FileText size={16} /></div>
          <div><h1 className="text-xl font-bold">Bulk Add Programs</h1><p className="text-sm text-muted-foreground">Template includes a department reference sheet</p></div>
        </div>
      </div>
      <BulkUploadPanel
        templateUrl={EP.programs.template}
        uploadUrl={EP.programs.bulkUpload}
        templateName="program-template.xlsx"
        module="Program"
        onSuccess={() => navigate(ROUTES.programs.list)}
        fields={FIELDS}
      />
    </div>
  );
}
