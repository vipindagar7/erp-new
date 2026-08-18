// src/modules/student/components/StudentTable.jsx
import { useNavigate } from "react-router-dom";
import { fmtSection } from "../../../../lib/formatSection.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[8, 18, 32, 22, 18, 18, 12, 8].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function StudentTable({
  students = [],
  loading = false,
  page = 1,
  limit = 20,
  checkedIds = [],
  onToggleCheck,
  onToggleAll,
  onPromote,
  onChangeSection,
  onToggleBlock,
  onDelete,
  activeFilterCount = 0,
}) {
  const navigate = useNavigate();
  const { can, isSuperAdmin } = usePageGuard();

  const getEnrollment = (s) =>
    s.enrollments?.find((e) => e.is_current) ||
    s.studentEnrollments?.find((e) => e.is_current);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={checkedIds.length === students.length && students.length > 0}
                  onChange={onToggleAll}
                  className="rounded"
                />
              </th>
              {["#", "Roll No", "Name", "Group", "Section", "Dept", "Enrollment", "Status", ""].map((h) => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : students.length === 0
                ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-sm text-muted-foreground">
                      {activeFilterCount > 0
                        ? "No students match these filters"
                        : "No students yet — add one to get started"}
                    </td>
                  </tr>
                )
                : students.map((s, idx) => {
                    const enr     = getEnrollment(s);
                    const blocked = s.user?.isBlocked;
                    const isSel   = checkedIds.includes(s.id);
                    const rollNo  = s.roll_no || s.roll_number;

                    return (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                        className={`border-b border-border last:border-0 transition-colors group cursor-pointer ${
                          isSel ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isSel} onChange={() => onToggleCheck(s.id)} className="rounded" />
                        </td>

                        {/* # */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {(page - 1) * limit + idx + 1}
                        </td>

                        {/* Roll No */}
                        <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {rollNo}
                        </td>

                        {/* Name */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                              {s.first_name?.[0] || "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate flex items-center gap-1.5">
                                {s.first_name} {s.last_name}
                                {blocked && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium shrink-0">
                                    Blocked
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{s.user?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Group */}
                        <td className="px-3 py-3 text-xs text-muted-foreground">{s.group_no || "—"}</td>

                        {/* Section */}
                        <td className="px-3 py-3 text-xs">
                          <p className="font-medium text-foreground">
                            {[s.section?.course?.program?.name, s.section?.course?.name].filter(Boolean).join(" › ")}
                            {" › "}
                            <span className="text-primary">{fmtSection(s.section, "short")}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Sem {s.section?.semester} · {s.section?.batch || s.batch_year || "—"}
                          </p>
                        </td>

                        {/* Dept */}
                        <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[120px]">
                          {s.department?.name || "—"}
                        </td>

                        {/* Enrollment */}
                        <td className="px-3 py-3">
                          {enr ? (
                            <div className="text-xs">
                              <span className="font-medium text-foreground">{enr.academic_year}</span>
                              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                enr.semester % 2 === 1
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                  : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                              }`}>
                                Sem {enr.semester}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          {enr && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              enr.status === "ACTIVE"   ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                              enr.status === "DETAINED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              enr.status === "PASSED"   ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}>{enr.status}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end">

                            {/* View */}
                            <button
                              onClick={() => navigate(`/admin/students/${s.id}`)}
                              title="View profile"
                              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>

                            {/* Edit */}
                            {can("students.update") && (
                              <button
                                onClick={() => navigate(`/admin/students/${s.id}/edit`)}
                                title="Edit"
                                className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            )}

                            {/* Promote */}
                            {can("students.promote") && (
                              <button
                                onClick={() => onPromote?.(s)}
                                title="Promote"
                                className="h-7 w-7 rounded-md hover:bg-green-100 dark:hover:bg-green-950/30 flex items-center justify-center text-muted-foreground hover:text-green-600"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                              </button>
                            )}

                            {/* Change section */}
                            {can("students.update") && (
                              <button
                                onClick={() => onChangeSection?.(s)}
                                title="Change section"
                                className="h-7 w-7 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/30 flex items-center justify-center text-muted-foreground hover:text-blue-600"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l14 9-14 9V3z"/></svg>
                              </button>
                            )}

                            {/* Block / Unblock */}
                            {can("students.block") && (
                              <button
                                onClick={() => onToggleBlock?.(s)}
                                title={blocked ? "Unblock" : "Block"}
                                className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                                  blocked
                                    ? "hover:bg-green-100 text-green-600"
                                    : "hover:bg-orange-100 text-muted-foreground hover:text-orange-600"
                                }`}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {blocked
                                    ? <><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></>
                                    : <><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></>
                                  }
                                </svg>
                              </button>
                            )}

                            {/* Delete */}
                            {(can("students.delete") || isSuperAdmin) && (
                              <button
                                onClick={() => onDelete?.(s)}
                                title="Delete"
                                className="h-7 w-7 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
