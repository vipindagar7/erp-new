// src/modules/section/pages/SectionBulkPage.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";

const FIELDS = [
  { label: "name",                       required: true,  notes: "Section name e.g. CSE-A, ECE-S3-B" },
  { label: "branch_code",                required: true,  notes: "From Branches reference sheet (uses branch_id in schema_v2)" },
  { label: "semester",                   required: true,  notes: "Integer 1–8" },
  { label: "batch",                      required: true,  notes: "e.g. 2024-2028" },
  { label: "academic_year",              required: false, notes: "e.g. 2024-25" },
  { label: "room_no",                    required: false, notes: "Classroom number" },
  { label: "capacity",                   required: false, notes: "Max students" },
  { label: "class_coordinator_emp_id",   required: false, notes: "Faculty emp_id from Faculty reference sheet" },
  { label: "is_combined",                required: false, notes: "true if FYE combined section. Default: false" },
  { label: "description",                required: false, notes: "Free text" },
];

export default function SectionBulkPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.sections.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center"><Layers size={16} /></div>
          <div>
            <h1 className="text-xl font-bold">Bulk Add Sections</h1>
            <p className="text-sm text-muted-foreground">Template includes branches &amp; faculty reference sheets</p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        <strong>Note:</strong> Uses <code className="font-mono bg-amber-100 px-1 rounded">branch_id</code> (schema_v2).
        Section codes are auto-generated as <code className="font-mono bg-amber-100 px-1 rounded">BRANCH-S{"{sem}"}-{"{name}"}-{"{batch_year}"}</code>.
        Duplicate codes are reported as failures — adjust section name or batch to fix.
      </div>

      <BulkUploadPanel
        templateUrl={EP.sections.template}
        uploadUrl={EP.sections.bulkUpload}
        templateName="section-template.xlsx"
        module="Section"
        onSuccess={() => navigate(ROUTES.sections.list)}
        fields={FIELDS}
      />
    </div>
  );
}
