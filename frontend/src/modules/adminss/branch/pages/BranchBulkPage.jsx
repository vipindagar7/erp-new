// src/modules/branch/pages/BranchBulkPage.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GitMerge } from "lucide-react";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";

const FIELDS = [
  { label: "name",                        required: true,  notes: "Branch display name e.g. Computer Science & Engineering" },
  { label: "program_code",                required: true,  notes: "From Programs reference sheet" },
  { label: "branch_code",                 required: false, notes: "Auto-generated from program code + name if blank. Must be unique." },
  { label: "intake_capacity",             required: false, notes: "Seats per batch" },
  { label: "total_semesters_override",    required: false, notes: "Override program's max_semesters (e.g. lateral entry branch)" },
  { label: "has_combined_first_year",     required: false, notes: "true if FYE/combined first year batch. Default: false" },
  { label: "start_session",               required: false, notes: "e.g. 2019-20 (first batch admitted)" },
  { label: "description",                 required: false, notes: "Free text" },
];

export default function BranchBulkPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.branches.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><GitMerge size={16} /></div>
          <div><h1 className="text-xl font-bold">Bulk Add Branches</h1><p className="text-sm text-muted-foreground">Template includes programs &amp; departments reference sheets</p></div>
        </div>
      </div>
      <BulkUploadPanel
        templateUrl={EP.branches.template}
        uploadUrl={EP.branches.bulkUpload}
        templateName="branch-template.xlsx"
        module="Branch"
        onSuccess={() => navigate(ROUTES.branches.list)}
        fields={FIELDS}
      />
    </div>
  );
}
