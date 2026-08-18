// frontend/src/layouts/FacultyLayout.jsx
import { AppShell }           from "./AppShell.jsx";
import { FACULTY_NAV }      from "../config/nav.config.js";
export default function FacultyLayout() {
  return (
    <AppShell
      navItems={FACULTY_NAV}
      dashboardLabel="Faculty Dashboard"
    />
  );
}
