// src/pages/UnauthorizedPage.jsx
import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
        <ShieldOff size={28} className="text-red-500"/>
      </div>
      <div>
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          You don't have permission to access this page. Contact your administrator to get access.
        </p>
      </div>
      <button onClick={() => navigate("/admin")}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">
        <ArrowLeft size={14}/>Back to Dashboard
      </button>
    </div>
  );
}