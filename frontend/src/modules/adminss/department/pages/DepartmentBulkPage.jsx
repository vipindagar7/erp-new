// src/modules/department/pages/DepartmentBulkPage.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { EP } from "../../../../config/api.config.js";
import { ROUTES } from "../../../../config/routes.js";
import BulkUploadPanel from "../../../../components/shared/BulkUploadPanel.jsx";

const FIELDS = [
  { label: "name",             required: true,  notes: "Department display name. Must be unique." },
  { label: "code",             required: false, notes: "Auto-generated from initials if blank. Max 6 chars, uppercase." },
  { label: "description",      required: false, notes: "Free text" },
  { label: "website",          required: false, notes: "Full URL including https://" },
  { label: "phone",            required: false, notes: "Contact number" },
  { label: "established_year", required: false, notes: "4-digit year e.g. 2005" },
];

export default function DepartmentBulkPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(ROUTES.departments.hub)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18} /></button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Building2 size={16} /></div>
          <div><h1 className="text-xl font-bold">Bulk Add Departments</h1><p className="text-sm text-muted-foreground">Download the template, fill it and upload</p></div>
        </div>
      </div>
      <BulkUploadPanel
        templateUrl={EP.departments.template}
        uploadUrl={EP.departments.bulkUpload}
        templateName="department-template.xlsx"
        module="Department"
        onSuccess={() => navigate(ROUTES.departments.list)}
        fields={FIELDS}
      />
    </div>
  );
}
