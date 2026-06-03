// frontend/src/components/shared/ImpersonationBanner.jsx
import { useSelector } from "react-redux";
import { Eye, LogOut } from "lucide-react";

export default function ImpersonationBanner({ onExit }) {
  const { impersonatedUser } = useSelector((s) => s.auth);

  return (
    <div className="shrink-0 bg-amber-400 dark:bg-amber-600 text-amber-900 dark:text-amber-50 px-4 py-2 flex items-center gap-3 shadow-sm z-50">
      <Eye size={14} className="shrink-0" />
      <p className="text-sm font-medium flex-1 min-w-0">
        Viewing as{" "}
        <strong className="font-semibold">{impersonatedUser?.email}</strong>
        <span className="ml-1.5 text-xs opacity-75">({impersonatedUser?.role})</span>
        <span className="ml-2 text-xs opacity-60">· Session expires in 15 min</span>
      </p>
      <button
        onClick={onExit}
        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-amber-900/20 hover:bg-amber-900/30 dark:bg-white/20 dark:hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
      >
        <LogOut size={12} />
        Exit &amp; return to admin
      </button>
    </div>
  );
}