// src/modules/adminss/fee/pages/FeeStudentDetailPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function FeeStudentDetailPage() {
  const { sid } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({ amount:"", payment_mode:"CASH", receipt_no:"", remarks:"" });
  const [saving, setSaving] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    Promise.all([
      axiosInstance.get(EP.students.byId(sid)),
      axiosInstance.get(EP.sessions.list),
    ]).then(([sRes, sesRes]) => {
      setStudent(sRes.data?.data);
      const ses = sesRes.data?.data || [];
      setSessions(ses);
      const cur = ses.find(s=>s.is_current);
      if (cur) { setSessionId(cur.id); loadPayments(cur.id); }
    }).finally(() => setLoading(false));
  }, [sid]);

  const loadPayments = async (sesId) => {
    const res = await axiosInstance.get(EP.fee.student(sid) + `?session_id=${sesId||sessionId}`).catch(()=>({data:{data:[]}}));
    setPayments(res.data?.data || []);
  };

  const recordPayment = async () => {
    if (!payForm.amount) { notify.error("Enter amount"); return; }
    setSaving(true);
    try {
      await axiosInstance.post(EP.fee.record(payModal.id), { ...payForm, amount: parseFloat(payForm.amount) });
      notify.success("Payment recorded");
      setPayModal(null);
      loadPayments();
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const printReceipt = (p) => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;}</style></head><body>
    <h2 style="text-align:center">ECHELON INSTITUTE OF TECHNOLOGY</h2>
    <h3 style="text-align:center">Fee Payment Receipt</h3>
    <table><tr><th>Student</th><td>${student?.name}</td><th>Roll No</th><td>${student?.roll_no}</td></tr>
    <tr><th>Amount Paid</th><td>₹${p.paid_amount}</td><th>Receipt No</th><td>${p.receipt_no||"—"}</td></tr>
    <tr><th>Payment Mode</th><td>${p.payment_mode||"—"}</td><th>Date</th><td>${p.payment_date?new Date(p.payment_date).toLocaleDateString("en-IN"):"—"}</td></tr>
    <tr><th>Status</th><td>${p.status}</td><th>Installment</th><td>${p.installment_no}</td></tr></table>
    <br/><p style="text-align:right">Accounts Officer Signature: _____________</p>
    </body></html>`);
    w.document.close();
    setTimeout(()=>w.print(),300);
  };

  const feeTotal = payments.reduce((s,p)=>s+(p.total_amount||0),0);
  const feePaid  = payments.reduce((s,p)=>s+(p.paid_amount||0),0);
  const feeDue   = feeTotal - feePaid;

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/admin/fee/students")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{student?.name}</h1>
          <p className="text-sm text-muted-foreground">{student?.roll_no} · {student?.section?.name}</p>
        </div>
        <select value={sessionId} onChange={e=>{setSessionId(e.target.value);loadPayments(e.target.value);}}
          className="h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none">
          {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Fee",  value:`₹${feeTotal.toLocaleString()}`,  color:"text-foreground" },
          { label:"Paid",       value:`₹${feePaid.toLocaleString()}`,   color:"text-green-600"  },
          { label:"Due",        value:`₹${feeDue.toLocaleString()}`,    color:feeDue>0?"text-red-500":"text-green-600" },
        ].map(s=>(
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Installments */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Installment-wise Details</p>
        </div>
        {payments.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No fee records. <button className="text-primary hover:underline" onClick={()=>navigate(`/admin/fee/student/${sid}/init`)}>Initialize fee →</button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map(p=>(
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Installment {p.installment_no}</p>
                  <p className="text-xs text-muted-foreground">
                    Total: ₹{p.total_amount} · Paid: ₹{p.paid_amount||0} · Due: ₹{p.due_amount||0}
                  </p>
                  {p.payment_date && <p className="text-xs text-muted-foreground">Paid on: {new Date(p.payment_date).toLocaleDateString("en-IN")}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
                  ${p.status==="PAID"?"bg-green-50 text-green-700 border-green-200":p.status==="PARTIAL"?"bg-amber-50 text-amber-700 border-amber-200":p.status==="WAIVED"?"bg-violet-50 text-violet-700 border-violet-200":"bg-red-50 text-red-700 border-red-200"}`}>
                  {p.status}
                </span>
                <div className="flex gap-2">
                  {p.status !== "PAID" && p.status !== "WAIVED" && (
                    <button onClick={()=>setPayModal(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
                      <Plus size={10}/>Collect
                    </button>
                  )}
                  {p.status === "PAID" && (
                    <button onClick={()=>printReceipt(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted/40">
                      <Printer size={10}/>Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Record Payment — Installment {payModal.installment_no}</h2>
              <button onClick={()=>setPayModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">✕</button>
            </div>
            <p className="text-sm text-muted-foreground">Pending: ₹{payModal.due_amount?.toLocaleString()}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Amount Received *</label>
                <input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))}
                  placeholder="0.00" className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Payment Mode</label>
                <select value={payForm.payment_mode} onChange={e=>setPayForm(f=>({...f,payment_mode:e.target.value}))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none">
                  {["CASH","DD","NEFT","CHEQUE","UPI"].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Receipt No</label>
                <input value={payForm.receipt_no} onChange={e=>setPayForm(f=>({...f,receipt_no:e.target.value}))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"/>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setPayModal(null)} className="flex-1 h-10 rounded-xl border border-border text-sm hover:bg-muted/40">Cancel</button>
              <button onClick={recordPayment} disabled={saving} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                {saving?"Saving…":"Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
