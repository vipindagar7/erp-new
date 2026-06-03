// frontend/src/layout/adminLayout.jsx
import AppLayout from "./AppLayout.jsx";
import { ADMIN_NAV } from "../config/navConfig.js";

export default function AdminLayout() {
  return <AppLayout navItems={ADMIN_NAV} />;
}