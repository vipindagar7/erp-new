// frontend/src/layout/facultyLayout.jsx
import AppLayout from "./AppLayout.jsx";
import { FACULTY_NAV } from "../config/navConfig.js";

export default function FacultyLayout() {
  return <AppLayout navItems={FACULTY_NAV} />;
}