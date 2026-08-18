// src/modules/student/pages/CertificateUploadPage.jsx
// Student portal — upload completion certificate for a skill card entry
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Upload, CheckCircle, Loader2, Award, ExternalLink } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";

export default function CertificateUploadPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const entryId        = searchParams.get("entry_id");
  const { user }       = useSelector(s => s.auth);
  const studentId      = user?.student?.id;

  const [entry,    setEntry]    = useState(null);
  const [certUrl,  setCertUrl]  = useState("");
  const [loading,  setLoading]  = useState(!!entryId);
  const [saving,   setSaving]   = useState(false);
  const [card,     setCard]     = useState(null);

  useEffect(() => {
    if (!studentId) return;
    axiosInstance.get(EP.skillCard.student(studentId))
      .then(r => { setCard(r.data?.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  const submit = async (eid) => {
    if (!certUrl) { notify.error("Enter certificate URL or paste link"); return; }
    setSaving(true);
    try {
      await axiosInstance.patch(EP.skillCard.updateEntry(eid), {
        certificate_url: certUrl,
        is_completed:    true,
        completion_date: new Date().toISOString().slice(0,10),
      });
      notify.success("Certificate submitted for verification!");
      setCertUrl("");
      const res = await axiosInstance.get(EP.skillCard.student(studentId));
      setCard(res.data?.data);
    } catch(e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground"/></div>;

  const pending = card?.entries?.filter(e => !e.is_completed) || [];

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><ArrowLeft size={18}/></button>
        <h1 className="text-xl font-bold flex items-center gap-2"><Upload size={18} className="text-primary"/>Upload Certificate</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <p className="font-semibold mb-1">📋 How to submit:</p>
        <p>1. Complete the course/training on the platform</p>
        <p>2. Download your certificate and upload it to Google Drive / OneDrive / any cloud</p>
        <p>3. Paste the shareable link below and submit — mentor will verify</p>
      </div>

      {/* Pending entries */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Pending Entries ({pending.length})</p>
        </div>
        {pending.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <CheckCircle size={32} className="mx-auto text-green-500"/>
            <p className="text-sm font-medium text-green-600">All entries completed!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {pending.slice(0,10).map(e => (
              <div key={e.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.course_name}</p>
                    <p className="text-xs text-muted-foreground">{e.provider} · Sem {e.semester_no}</p>
                    {e.course_url && (
                      <a href={`https://${e.course_url}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                        <ExternalLink size={10}/>Open Course
                      </a>
                    )}
                  </div>
                  <Award size={16} className="text-muted-foreground/30 shrink-0 mt-0.5"/>
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="Paste certificate link (Google Drive, LinkedIn, etc.)…"
                    defaultValue=""
                    id={`cert-${e.id}`}
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={() => {
                      const url = document.getElementById(`cert-${e.id}`)?.value;
                      if (url) { setCertUrl(url); submit(e.id); }
                      else notify.error("Enter certificate URL");
                    }}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60">
                    {saving ? <Loader2 size={11} className="animate-spin"/> : <Upload size={11}/>}
                    Submit
                  </button>
                </div>
              </div>
            ))}
            {pending.length > 10 && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                +{pending.length - 10} more — <button onClick={() => navigate("/student/skill-card")} className="text-primary hover:underline">View all →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
