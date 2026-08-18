// frontend/src/layouts/StudentLayout.jsx
import { AppShell }           from "./AppShell.jsx";
import { STUDENT_NAV }      from "../config/nav.config.js";
export default function StudentLayout() {
  return (
    <AppShell
      navItems={STUDENT_NAV}
      dashboardLabel="Student Dashboard"
    />
  );
}
