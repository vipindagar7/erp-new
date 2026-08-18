// src/components/shared/StatusBadge.jsx
import { cn } from "../../lib/utils.js";

const VARIANTS = {
  ACTIVE:       "bg-green-100 text-green-700 border-green-200",
  INACTIVE:     "bg-gray-100 text-gray-600 border-gray-200",
  ARCHIVED:     "bg-gray-100 text-gray-500 border-gray-200",
  DELETED:      "bg-red-100 text-red-700 border-red-200",
  PENDING:      "bg-yellow-100 text-yellow-700 border-yellow-200",
  BLOCKED:      "bg-red-100 text-red-700 border-red-200",
  DISCONTINUED: "bg-amber-100 text-amber-700 border-amber-200",
  DETAINED:     "bg-orange-100 text-orange-700 border-orange-200",
  TRANSFERRED:  "bg-blue-100 text-blue-700 border-blue-200",
  PASSED:       "bg-emerald-100 text-emerald-700 border-emerald-200",
  FAILED:       "bg-red-100 text-red-700 border-red-200",
  DROPPED:      "bg-gray-100 text-gray-600 border-gray-200",
  COMBINED:     "bg-violet-100 text-violet-700 border-violet-200",
  CREATE:       "bg-green-100 text-green-700 border-green-200",
  UPDATE:       "bg-blue-100 text-blue-700 border-blue-200",
  DELETE:       "bg-red-100 text-red-700 border-red-200",
  RESTORE:      "bg-violet-100 text-violet-700 border-violet-200",
  DEACTIVATE:   "bg-amber-100 text-amber-700 border-amber-200",
  REACTIVATE:   "bg-teal-100 text-teal-700 border-teal-200",
  DISCONTINUE:  "bg-amber-100 text-amber-700 border-amber-200",
  PROMOTE:      "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const LABELS = {
  ACTIVE:"Active", INACTIVE:"Inactive", ARCHIVED:"Archived", DELETED:"Deleted",
  PENDING:"Pending", BLOCKED:"Blocked", DISCONTINUED:"Discontinued",
  DETAINED:"Detained", TRANSFERRED:"Transferred", PASSED:"Passed",
  FAILED:"Failed", DROPPED:"Dropped", COMBINED:"Combined Y1",
  CREATE:"Create", UPDATE:"Update", DELETE:"Delete", RESTORE:"Restore",
  DEACTIVATE:"Deactivate", REACTIVATE:"Reactivate", DISCONTINUE:"Discontinue",
  PROMOTE:"Promote",
};

export function StatusBadge({ status, label, className, size = "sm" }) {
  const key      = String(status || "").toUpperCase();
  const variant  = VARIANTS[key] || "bg-gray-100 text-gray-600 border-gray-200";
  const text     = label || LABELS[key] || status || "—";
  const sizeClass = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  return (
    <span className={cn(`inline-flex items-center font-medium rounded-full border ${sizeClass}`, variant, className)}>
      {text}
    </span>
  );
}
export default StatusBadge;
