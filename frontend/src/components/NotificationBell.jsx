// frontend/src/components/NotificationBell.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../redux/notifications/notificationSlice.js";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { cn } from "../lib/utils.js";

const typeColor = (type) => {
  switch (type) {
    case "NEW_FEEDBACK_FORM": return "bg-amber-100 text-amber-700";
    case "PROMOTION": return "bg-green-100 text-green-700";
    case "DEMOTION": return "bg-red-100 text-red-700";
    case "SECTION_CHANGE": return "bg-blue-100 text-blue-700";
    case "ACCOUNT_BLOCKED": return "bg-red-100 text-red-700";
    case "ACCOUNT_UNBLOCKED": return "bg-green-100 text-green-700";
    default: return "bg-slate-100 text-slate-600";
  }
};

const typeLabel = (type) =>
  type?.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) ?? "General";

const timeAgo = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function NotificationBell() {
  const dispatch = useDispatch();

  // Use shallowEqual for array selector to prevent new reference on every render
  const list = useSelector((s) => s.notifications?.list ?? [], shallowEqual);
  const unreadCount = useSelector((s) => s.notifications?.unreadCount ?? 0);
  const loading = useSelector((s) => s.notifications?.loading ?? false);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Poll unread count every 60s
  useEffect(() => {
    dispatch(fetchUnreadCount());
    const iv = setInterval(() => dispatch(fetchUnreadCount()), 60000);
    return () => clearInterval(iv);
  }, [dispatch]);

  // Load full list when panel opens
  useEffect(() => {
    if (open) dispatch(fetchNotifications({ limit: 30 }));
  }, [open, dispatch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = (id) => dispatch(markNotificationRead(id));
  const handleDelete = (id) => dispatch(deleteNotification(id));
  const handleMarkAll = () => dispatch(markAllNotificationsRead());

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-slate-500" />
              <span className="font-semibold text-slate-700 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={handleMarkAll} title="Mark all read"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <CheckCheck size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && list.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Loading…</div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : list.map((n) => (
              <div key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 group",
                  !n.is_read && "bg-blue-50/40"
                )}>
                {/* Unread dot */}
                <div className="mt-1 shrink-0">
                  {!n.is_read
                    ? <span className="w-2 h-2 rounded-full bg-blue-500 block" />
                    : <span className="w-2 h-2 block" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", typeColor(n.type))}>
                      {typeLabel(n.type)}
                    </span>
                    <span className="text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!n.is_read && (
                    <button onClick={() => handleMarkRead(n.id)} title="Mark as read"
                      className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                      <Check size={12} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(n.id)} title="Delete"
                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {list.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
              <button onClick={() => setOpen(false)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}