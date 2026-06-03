// frontend/src/layouts/StudentLayout.jsx
import AppLayout from "./AppLayout.jsx";
import { STUDENT_NAV } from "../config/navConfig.js";

export default function StudentLayout() {
  return <AppLayout navItems={STUDENT_NAV} />;
}