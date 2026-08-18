// src/modules/adminss/faculty/pages/FacultyIdCardPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate }      from "react-router-dom";
import { Loader2, Download, Printer, ArrowLeft, User } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP }        from "../../../../config/api.config.js";
import { Button }    from "@/components/ui/button";

const BLOOD_COLOR = { "A+":"bg-red-100 text-red-700","A-":"bg-red-100 text-red-700","B+":"bg-blue-100 text-blue-700","B-":"bg-blue-100 text-blue-700","AB+":"bg-violet-100 text-violet-700","AB-":"bg-violet-100 text-violet-700","O+":"bg-green-100 text-green-700","O-":"bg-green-100 text-green-700" };

export default function FacultyIdCardPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const cardRef   = useRef(null);
  const [faculty, setFaculty]  = useState(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (!id) return;
    axiosInstance.get(EP.faculty.byId(id))
      .then(r => setFaculty(r.data?.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    // Use browser print to PDF
    window.print();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={24} className="animate-spin text-muted-foreground"/>
    </div>
  );
  if (!faculty) return (
    <div className="text-center py-20 text-muted-foreground">Faculty not found</div>
  );

  const initials = faculty.name?.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <Button variant="outline" size="sm" onClick={()=>navigate(-1)}>
          <ArrowLeft size={13} className="mr-1.5"/>Back
        </Button>
        <div className="flex-1"/>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer size={13} className="mr-1.5"/>Print
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download size={13} className="mr-1.5"/>Download PDF
        </Button>
      </div>

      {/* ID Card — print-optimised */}
      <div ref={cardRef} id="faculty-idcard"
        className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-primary shadow-2xl bg-white"
        style={{fontFamily:"'Segoe UI',Arial,sans-serif"}}>

        {/* Header */}
        <div className="bg-primary px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xs font-bold">EIT</div>
            <div>
              <p className="font-bold text-sm leading-tight">Echelon Institute of Technology</p>
              <p className="text-[10px] opacity-80">Faridabad, Haryana</p>
            </div>
          </div>
          <div className="mt-2 text-[10px] opacity-70 border-t border-white/20 pt-2">
            Affiliated to GGSIPU, Delhi · AICTE Approved
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex gap-4 items-start">
            {/* Photo */}
            <div className="w-24 h-28 rounded-xl border-2 border-primary/30 overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {faculty.photo_url
                ? <img src={faculty.photo_url} alt={faculty.name} className="w-full h-full object-cover"/>
                : <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{initials}</span>
                  </div>
              }
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="bg-primary/5 rounded-xl px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Identity Card</p>
                <p className="font-bold text-base leading-tight mt-0.5">{faculty.name}</p>
              </div>
              <div className="space-y-1">
                {[
                  ["Designation",  faculty.designation],
                  ["Department",   faculty.department?.name],
                  ["Emp ID",       faculty.emp_id],
                  ["Employee Code",faculty.employee_code],
                ].filter(([,v])=>v).map(([label,val])=>(
                  <div key={label} className="flex gap-1.5 text-xs">
                    <span className="text-muted-foreground w-20 shrink-0">{label}:</span>
                    <span className="font-medium truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Extra details */}
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              ["Phone",        faculty.phone],
              ["Blood Group",  faculty.blood_group],
              ["DOB",          faculty.dob ? new Date(faculty.dob).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : null],
              ["Joining Date", faculty.joining_date ? new Date(faculty.joining_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : null],
              ["Type",         faculty.employee_type],
              ["Teaching",     faculty.is_teaching ? "Teaching" : "Non-Teaching"],
            ].filter(([,v])=>v).map(([label,val])=>(
              <div key={label}>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="font-medium">{val}</p>
              </div>
            ))}
          </div>

          {/* Address */}
          {faculty.address && (
            <div className="border-t border-border pt-3 text-xs">
              <p className="text-[10px] text-muted-foreground mb-0.5">Address</p>
              <p>{faculty.address}{faculty.city?`, ${faculty.city}`:""}{faculty.pincode?` - ${faculty.pincode}`:""}</p>
            </div>
          )}

          {/* Emergency contact */}
          {faculty.emergency_contact && (
            <div className="border-t border-border pt-3 text-xs">
              <p className="text-[10px] text-muted-foreground mb-0.5">Emergency Contact</p>
              <p className="font-medium">{faculty.emergency_contact} ({faculty.emergency_relation})</p>
              <p>{faculty.emergency_phone}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-5 py-3 border-t border-border">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>This is an official identity card</span>
            <span>EIT Faridabad</span>
          </div>
          <div className="mt-2 h-8 border border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-[9px] text-muted-foreground">
            Authorised Signature
          </div>
        </div>
      </div>

      {/* Print style */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #faculty-idcard, #faculty-idcard * { visibility: visible; }
          #faculty-idcard { position: fixed; left: 50%; top: 50%; transform: translate(-50%,-50%); box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}