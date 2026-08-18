// src/modules/adminss/hr/pages/SalarySlipDetailPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, CheckCircle, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function SlipPrint({ slip }) {
  if (!slip) return null;
  const f  = slip.faculty;
  const earnings   = slip.components?.filter(c=>c.is_earning) || [];
  const deductions = slip.components?.filter(c=>!c.is_earning) || [];

  return (
    <div style={{fontFamily:"Arial,sans-serif",maxWidth:680,margin:"0 auto",border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:"#1e3a8a",color:"white",padding:"16px 20px"}}>
        <div style={{fontSize:16,fontWeight:900}}>ECHELON INSTITUTE OF TECHNOLOGY</div>
        <div style={{fontSize:10,opacity:0.8}}>Kabulpur, Kheri-Manjhawali Road, Faridabad-121101</div>
        <div style={{fontSize:13,fontWeight:700,marginTop:8}}>SALARY SLIP — {MONTHS[slip.month-1]} {slip.year}</div>
      </div>

      {/* Employee info */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:"12px 20px",borderBottom:"1px solid #e2e8f0",background:"#f8fafc"}}>
        {[["Name",f?.name],["Designation",f?.designation],["Emp ID",f?.emp_id],["Department",f?.department?.name],
          ["Working Days",slip.working_days],["Present Days",slip.present_days],["LOP Days",slip.lop_days||0],["Net Salary",`₹${slip.net_salary?.toLocaleString()}`]
        ].map(([l,v])=>v!=null&&(
          <div key={l}><div style={{fontSize:9,color:"#64748b"}}>{l}</div><div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{v}</div></div>
        ))}
      </div>

      {/* Earnings & Deductions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
        <div style={{borderRight:"1px solid #e2e8f0"}}>
          <div style={{background:"#dcfce7",padding:"6px 16px",fontSize:10,fontWeight:700,color:"#166534"}}>EARNINGS</div>
          {earnings.map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 16px",fontSize:11,borderBottom:"1px solid #f1f5f9"}}>
              <span>{c.component?.name}</span><span style={{fontWeight:600}}>₹{c.amount?.toLocaleString()}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 16px",fontSize:11,fontWeight:700,background:"#f0fdf4"}}>
            <span>GROSS SALARY</span><span>₹{slip.gross_salary?.toLocaleString()}</span>
          </div>
        </div>
        <div>
          <div style={{background:"#fee2e2",padding:"6px 16px",fontSize:10,fontWeight:700,color:"#991b1b"}}>DEDUCTIONS</div>
          {deductions.map(c=>(
            <div key={c.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 16px",fontSize:11,borderBottom:"1px solid #f1f5f9"}}>
              <span>{c.component?.name}</span><span style={{fontWeight:600}}>₹{c.amount?.toLocaleString()}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"6px 16px",fontSize:11,fontWeight:700,background:"#fef2f2"}}>
            <span>TOTAL DEDUCTIONS</span><span>₹{slip.total_deductions?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Net salary */}
      <div style={{background:"#1e3a8a",color:"white",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,opacity:0.7}}>NET SALARY</div>
          <div style={{fontSize:22,fontWeight:900}}>₹{slip.net_salary?.toLocaleString()}</div>
        </div>
        <div style={{textAlign:"right",fontSize:9,opacity:0.7}}>
          Status: {slip.status}<br/>
          {slip.approved_at && `Approved: ${new Date(slip.approved_at).toLocaleDateString("en-IN")}`}
        </div>
      </div>

      {/* Footer */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,padding:"12px 20px",background:"#f8fafc"}}>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1px solid #94a3b8",paddingTop:4,fontSize:9,color:"#64748b"}}>Employee Signature</div></div>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1px solid #94a3b8",paddingTop:4,fontSize:9,color:"#64748b"}}>HR Manager</div></div>
        <div style={{textAlign:"center"}}><div style={{borderTop:"1px solid #94a3b8",paddingTop:4,fontSize:9,color:"#64748b"}}>Accounts Officer</div></div>
      </div>
    </div>
  );
}

export default function SalarySlipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState("");
  const printRef = useRef();

  useEffect(() => {
    axiosInstance.get(EP.hr.slipById(id))
      .then(r => setSlip(r.data?.data))
      .catch(() => notify.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  const approve = async () => {
    setActing("approve");
    try {
      await axiosInstance.post(EP.hr.approve(id));
      notify.success("Approved");
      setSlip(prev => ({...prev, status:"APPROVED", approved_at:new Date().toISOString()}));
    } catch { notify.error("Failed"); }
    finally { setActing(""); }
  };

  const markPaid = async () => {
    setActing("paid");
    try {
      await axiosInstance.post(EP.hr.markPaid(id));
      notify.success("Marked as paid");
      setSlip(prev => ({...prev, status:"PAID"}));
    } catch { notify.error("Failed"); }
    finally { setActing(""); }
  };

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Salary Slip</title>
    <style>body{margin:20px;font-family:Arial,sans-serif;}@media print{@page{size:A4;margin:10mm;}}</style>
    </head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),300);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;
  if (!slip) return <div className="text-center py-20 text-sm text-muted-foreground">Slip not found</div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/hr/slips")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Salary Slip</h1>
          <p className="text-sm text-muted-foreground">{slip.faculty?.name} · {MONTHS[slip.month-1]} {slip.year}</p>
        </div>
        <div className="flex gap-2">
          {slip.status === "GENERATED" && (
            <button onClick={approve} disabled={acting==="approve"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60">
              {acting==="approve"?<Loader2 size={13} className="animate-spin"/>:<CheckCircle size={13}/>}Approve
            </button>
          )}
          {slip.status === "APPROVED" && (
            <button onClick={markPaid} disabled={acting==="paid"}
              className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted/40 disabled:opacity-60">
              {acting==="paid"?"Marking…":"Mark Paid"}
            </button>
          )}
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Printer size={14}/>Print / PDF
          </button>
        </div>
      </div>

      <div ref={printRef}>
        <SlipPrint slip={slip}/>
      </div>
    </div>
  );
}
