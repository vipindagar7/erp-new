// src/modules/adminss/exam/pages/ExamHallTicketPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Loader2, Users, FileText } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

const EIT = { name:"ECHELON INSTITUTE OF TECHNOLOGY", addr:"Kabulpur, Kheri-Manjhawali Road, Faridabad-121101", affil:"Affiliated to GGSIPU, Delhi" };

function HallTicket({ data }) {
  const { student, exam, seatings, ticket } = data;
  return (
    <div style={{width:"100%",maxWidth:680,border:"2px solid #1e3a8a",borderRadius:10,overflow:"hidden",fontFamily:"Arial,sans-serif",background:"white",marginBottom:20}}>
      {/* Header */}
      <div style={{background:"#1e3a8a",padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:48,height:48,background:"white",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#1e3a8a",flexShrink:0}}>EIT</div>
        <div style={{flex:1}}>
          <div style={{color:"white",fontSize:14,fontWeight:900}}>{EIT.name}</div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:10}}>{EIT.affil}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:9}}>{EIT.addr}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"white",fontSize:11,fontWeight:700}}>HALL TICKET</div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:9}}>{exam?.exam_type?.replace(/_/g," ")}</div>
        </div>
      </div>

      {/* Student info */}
      <div style={{display:"flex",padding:"12px 16px",gap:12,borderBottom:"1px solid #e2e8f0"}}>
        <div style={{width:80,height:90,border:"1.5px solid #cbd5e1",borderRadius:6,overflow:"hidden",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {student?.photo_url
            ? <img src={student.photo_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontSize:28,fontWeight:900,color:"#94a3b8"}}>{student?.name?.charAt(0)}</span>
          }
        </div>
        <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 16px"}}>
          {[
            ["Name",        student?.name],
            ["Roll No",     student?.roll_no],
            ["Enrollment",  student?.enrollment_no],
            ["Branch",      student?.branch?.name],
            ["Section",     student?.section?.name],
            ["Semester",    student?.semester],
          ].map(([l,v])=> v && (
            <div key={l}>
              <div style={{fontSize:9,color:"#64748b"}}>{l}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:9,color:"#64748b"}}>Ticket No</div>
          <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a"}}>{ticket?.ticket_no}</div>
        </div>
      </div>

      {/* Schedule table */}
      <div style={{padding:"10px 16px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#1e3a8a",marginBottom:6}}>EXAM SCHEDULE & SEATING</div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}>
          <thead>
            <tr style={{background:"#eff6ff"}}>
              {["Date","Subject","Time","Hall","Seat No"].map(h=>(
                <th key={h} style={{padding:"5px 8px",textAlign:"left",fontWeight:700,color:"#1e40af",borderBottom:"1px solid #bfdbfe"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(exam?.schedule||[]).map((sch,i)=>{
              const seat = seatings?.find(s=>s.exam_date?.slice(0,10)===sch.exam_date?.slice(0,10));
              return (
                <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"5px 8px",fontWeight:600}}>{new Date(sch.exam_date).toLocaleDateString("en-IN",{dateStyle:"short"})}</td>
                  <td style={{padding:"5px 8px"}}>{sch.subject?.name}</td>
                  <td style={{padding:"5px 8px"}}>{sch.start_time}–{sch.end_time}</td>
                  <td style={{padding:"5px 8px"}}>{seat?.exam_room?.room?.code||"TBD"}</td>
                  <td style={{padding:"5px 8px",fontWeight:700,color:"#1e3a8a"}}>{seat?.seat_no||"TBD"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,padding:"10px 16px",borderTop:"1px solid #e2e8f0",background:"#f8fafc"}}>
        <div>
          <div style={{fontSize:8,color:"#64748b"}}>INSTRUCTIONS</div>
          <div style={{fontSize:8,color:"#475569",marginTop:2}}>• Bring this ticket to exam hall<br/>• Valid photo ID required<br/>• No mobile phones allowed</div>
        </div>
        <div style={{textAlign:"center",paddingTop:8}}>
          <div style={{borderTop:"1.5px solid #1e3a8a",paddingTop:4}}>
            <div style={{fontSize:8,color:"#64748b"}}>Controller of Examinations</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:"#64748b"}}>Date of Issue</div>
          <div style={{fontSize:9,fontWeight:600,color:"#1e293b"}}>{new Date().toLocaleDateString("en-IN")}</div>
        </div>
      </div>
    </div>
  );
}

export default function ExamHallTicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("student_id");

  const [exam, setExam] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    axiosInstance.get(EP.exam.byId(id))
      .then(r => { setExam(r.data?.data); })
      .catch(() => notify.error("Failed"))
      .finally(() => setLoading(false));
  }, [id]);

  const loadTicketData = async (sid) => {
    try {
      const res = await axiosInstance.get(EP.exam.ticketData(id, sid));
      setSelected(res.data?.data);
    } catch { notify.error("Failed to load ticket"); }
  };

  const handlePrint = () => {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Hall Ticket</title>
    <style>body{margin:20px;font-family:Arial,sans-serif;}@media print{@page{size:A5;margin:5mm;}}</style>
    </head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(()=>{w.print();},300);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/admin/exam/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Hall Tickets</h1>
          <p className="text-sm text-muted-foreground">{exam?.title}</p>
        </div>
        {selected && (
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Printer size={14}/>Print
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Student search panel */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Find Student</p>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Enter Roll No or Enrollment No…"
            className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
          <button onClick={() => {
            if (!search) return;
            axiosInstance.get(EP.students.all + `?search=${search}&limit=10`)
              .then(r => {
                const s = (r.data?.data||[])[0];
                if (s) loadTicketData(s.id);
                else notify.error("Student not found");
              });
          }} className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            Load Ticket
          </button>
          <div className="text-center text-xs text-muted-foreground">
            {exam?._count?.hallTickets||0} tickets generated total
          </div>
        </div>

        {/* Ticket preview */}
        <div className="bg-muted/20 border border-border rounded-2xl p-4">
          {selected ? (
            <div ref={printRef}>
              <HallTicket data={selected}/>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <FileText size={32} className="text-muted-foreground/30 mb-2"/>
              <p className="text-sm text-muted-foreground">Search for a student to preview their hall ticket</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
