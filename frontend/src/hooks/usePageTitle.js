// frontend/src/hooks/usePageTitle.js
import { useLocation } from "react-router-dom";
import { ADMIN_NAV, FACULTY_NAV, STUDENT_NAV } from "../config/navConfig.js";

const ALL_NAV = [...ADMIN_NAV, ...FACULTY_NAV, ...STUDENT_NAV];

export function usePageTitle() {
    const { pathname } = useLocation();

    const match = ALL_NAV
        .filter((item) => item.path)
        // exact match first, then prefix
        .sort((a, b) => b.path.length - a.path.length)
        .find((item) =>
            item.end
                ? pathname === item.path
                : pathname.startsWith(item.path)
        );

    return match?.label ?? "Dashboard";
}