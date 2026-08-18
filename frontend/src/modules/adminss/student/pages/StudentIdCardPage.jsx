// src/modules/adminss/student/pages/StudentIdCardPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Loader2, QrCode } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EIT = {
  name:  "ECHELON INSTITUTE OF TECHNOLOGY",
  addr:  "Kabulpur, Kheri-Manjhawali Road, Faridabad - 121101",
  affil: "Affiliated to GGSIPU, Delhi",
  site:  "www.eitfaridabad.com",
};

function IdCard({ s, side }) {
  return (
    <div style={{width:340,height:210,fontFamily:"Arial,sans-serif",background:"white",borderRadius:12,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",border:"2px solid #1e3a8a",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{background:"#1e3a8a",padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,background:"white",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#1e3a8a"}}>EIT</div>
        <div>
          <div style={{color:"white",fontSize:9,fontWeight:900,lineHeight:1.2}}>{EIT.name}</div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:7}}>{EIT.affil}</div>
        </div>
      </div>

      {side === "front" ? (
        <div style={{display:"flex",flex:1,padding:"10px 12px",gap:10}}>
          {/* Photo */}
          <div style={{width:62,height:72,borderRadius:8,border:"2px solid #cbd5e1",overflow:"hidden",background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {s?.photo_url
              ? <img src={s.photo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              : <span style={{fontSize:24,fontWeight:900,color:"#94a3b8"}}>{s?.name?.charAt(0)}</span>
            }
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:900,color:"#1e3a8a",lineHeight:1.2,marginBottom:2}}>{s?.name}</div>
            <div style={{fontSize:9,color:"#64748b",fontWeight:600,marginBottom:6}}>{s?.branch?.name || s?.program?.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px"}}>
              {[["Roll No",s?.roll_no],["Enroll No",s?.enrollment_no],["Semester",s?.semester],["Section",s?.section?.name],["Batch",s?.batch],["Dept",s?.department?.name]].map(([l,v])=> v && (
                <div key={l}>
                  <div style={{fontSize:7,color:"#94a3b8"}}>{l}</div>
                  <div style={{fontSize:9,fontWeight:700,color:"#1e293b"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{display:"flex",flex:1,padding:"10px 12px",gap:10}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,fontWeight:900,color:"#1e3a8a",marginBottom:4}}>STUDENT IDENTITY CARD</div>
            <div style={{fontSize:8,color:"#64748b",marginBottom:6}}>Valid for AY {new Date().getFullYear()}-{new Date().getFullYear()+1}</div>
            {[["Blood Group",s?.blood_group],["Phone",s?.phone],["Emergency",s?.emergency_phone],["Address",s?.address?.slice(0,40)]].map(([l,v])=> v && (
              <div key={l} style={{display:"flex",gap:4,marginBottom:2}}>
                <span style={{fontSize:7.5,color:"#94a3b8",width:60,flexShrink:0}}>{l}:</span>
                <span style={{fontSize:7.5,fontWeight:600,color:"#334155"}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:6,fontSize:7,color:"#94a3b8"}}>
              If found, return to: {EIT.addr}
            </div>
          </div>
          <div style={{width:62,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:56,height:56,border:"1.5px solid #cbd5e1",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
              <span style={{fontSize:10,color:"#94a3b8",textAlign:"center",lineHeight:1.2}}>QR<br/>Code</span>
            </div>
            <div style={{fontSize:7,color:"#94a3b8",textAlign:"center"}}>Scan to verify</div>
            <div style={{borderTop:"2px solid #cbd5e1",width:"100%",paddingTop:4,marginTop:"auto"}}>
              <div style={{fontSize:7,color:"#94a3b8",textAlign:"center"}}>Registrar</div>
            </div>
          </div>
        </div>
      )}

      <div style={{background:"#eff6ff",padding:"4px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:7,color:"#1e40af"}}>{EIT.addr}</span>
        <span style={{fontSize:7,color:"#64748b"}}>{EIT.site}</span>
      </div>
    </div>
  );
}

export default function StudentIdCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    axiosInstance.get(EP.students.byId(id))
      .then(r => setStudent(r.data?.data))
      .catch(() => notify.error("Failed to load student"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("","_blank","width=800,height=500");
    w.document.write(`<html><head><title>ID Card - ${student?.name}</title>
    <style>body{margin:0;display:flex;gap:20px;padding:20px;justify-content:center;align-items:center;min-height:100vh;background:white;}
    @media print{@page{size:A6 landscape;margin:5mm;}body{padding:0;}}</style>
    </head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 300);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!student) return <div className="text-center py-20 text-sm text-muted-foreground">Student not found</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/students/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">ID Card — {student.name}</h1>
          <p className="text-sm text-muted-foreground">{student.roll_no} · {student.section?.name}</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Printer size={14}/>Print / PDF
        </button>
      </div>

      {/* Preview */}
      <div ref={printRef} className="flex flex-col sm:flex-row gap-6 items-center justify-center p-8 bg-muted/20 rounded-2xl border border-border">
        <div className="text-center space-y-2">
          <IdCard s={student} side="front"/>
          <p className="text-xs text-muted-foreground">Front</p>
        </div>
        <div className="text-center space-y-2">
          <IdCard s={student} side="back"/>
          <p className="text-xs text-muted-foreground">Back</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        💡 Click "Print / PDF" → set paper to A6 landscape, set margins to minimum for best result.
      </div>
    </div>
  );
}
