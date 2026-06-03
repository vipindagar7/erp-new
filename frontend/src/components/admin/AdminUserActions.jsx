import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { startImpersonation } from "../../redux/auth/authSlice.js";
import { getRoleHome } from "../auth/RoleGuard.jsx";
import { notify } from "../../hooks/notify.js";
import { cn } from "../../lib/utils.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KeyRound, LogIn, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

/**
 * Drop-in action buttons for any user row in Students/Faculty/Admins pages.
 *
 * Usage:
 *   <AdminUserActions userId={user.user_id} userEmail={user.email} userRole={user.role} userName={user.name} />
 */
export default function AdminUserActions({ userId, userEmail, userRole, userName }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: me } = useSelector((s) => s.auth);

  const [resetOpen, setResetOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Cannot act on yourself or another super admin
  const isSelf = me?.id === userId;
  const isTarget = userRole === "SUPER_ADMIN";
  if (isSelf || isTarget) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Reset Password — any admin */}
        <button onClick={() => setResetOpen(true)} title="Reset password"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
          <KeyRound size={13} />
        </button>

        {/* Login As — any admin */}
        <button onClick={() => setLoginOpen(true)} title="Login as this user"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
          <LogIn size={13} />
        </button>
      </div>

      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        userId={userId}
        userEmail={userEmail}
        userName={userName}
      />

      <LoginAsModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        userId={userId}
        userEmail={userEmail}
        userRole={userRole}
        userName={userName}
        onSuccess={(data) => {
          dispatch(startImpersonation({ token: data.access, user: data.user, admin: me }));
          navigate(getRoleHome(data.user.role), { replace: true });
        }}
      />
    </>
  );
}

// ── Reset Password Modal ───────────────────────────────────────
function ResetPasswordModal({ open, onClose, userId, userEmail, userName }) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (password.length < 6) { notify.error("Minimum 6 characters"); return; }
    setSaving(true);
    try {
      await axiosInstance.post(EP.admins.resetPassword(userId), { password });
      notify.success(`Password reset for ${userEmail}`);
      setPassword("");
      onClose();
    } catch (e) { notify.error(e.response?.data?.message || "Reset failed"); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) { setPassword(""); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound size={16} /> Reset Password</DialogTitle>
          <DialogDescription>Set a new password for <strong>{userName || userEmail}</strong>.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              placeholder="New password (min 6 chars)"
              autoFocus
              className="w-full h-10 px-3 pr-10 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => setShowPw((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex gap-2 text-xs text-yellow-700 dark:text-yellow-400">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <p>The user will be able to log in with this new password immediately. They will not be notified automatically — inform them separately.</p>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handle} disabled={saving || password.length < 6}>
              {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
              Reset Password
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Login As Modal ─────────────────────────────────────────────
function LoginAsModal({ open, onClose, userId, userEmail, userRole, userName, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(EP.admins.impersonate(userId));
      onSuccess(res.data.data);
    } catch (e) { notify.error(e.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><LogIn size={16} /> Login as User</DialogTitle>
          <DialogDescription>You will temporarily access the system as this user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted/40 rounded-xl space-y-1">
            <p className="text-sm font-semibold text-foreground">{userName || userEmail}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
              userRole === "FACULTY" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                userRole === "STUDENT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400")}>
              {userRole}
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-2 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">You will see the system as <strong>{userName || userEmail}</strong>.</p>
              <p>An amber banner will appear at the top so you can exit at any time. Session expires in 15 minutes. This action is logged.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handle} disabled={loading}>
              {loading ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <LogIn size={13} className="mr-1.5" />}
              Login as {userName?.split(" ")[0] || "User"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}