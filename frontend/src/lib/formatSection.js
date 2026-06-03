/**
 * Shared section formatting utilities — use these EVERYWHERE sections are displayed.
 *
 * compact:  "BTech AIML Sem 4 A"          — for options, table cells
 * full:     "BTech › AIML › Sem 4 › Sec A · 2023-27" — for detail panels
 * short:    "AIML Sem 4 A"                — for chips, badges, narrow cols
 * export:   "BTech AIML 4 Sem A"         — for Excel sheet names (≤31 chars)
 */

export const fmtSection = (s, mode = "compact") => {
  if (!s) return "—";
  const prog   = s.course?.program?.name || "";
  const course = s.course?.name          || "";
  const sem    = s.semester != null ? `Sem ${s.semester}` : "";
  const sec    = s.name ? `Sec ${s.name}` : "";
  const batch  = s.batch || "";

  if (mode === "short")   return [course, sem, sec].filter(Boolean).join(" ");
  if (mode === "full")    return [[prog, course, sem, sec].filter(Boolean).join(" › "), batch].filter(Boolean).join(" · ");
  if (mode === "export")  return [prog, course, s.semester ? `${s.semester} Sem` : "", s.name].filter(Boolean).join(" ");
  // compact (default)
  return [prog, course, sem, sec].filter(Boolean).join(" ");
};

// For <option> elements: compact with batch
export const sectionOption = (s) => {
  const base = fmtSection(s, "compact");
  return s.batch ? `${base} · ${s.batch}` : base;
};
