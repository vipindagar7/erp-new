// frontend/src/hooks/sidebarContext.jsx
import { createContext, useContext, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggle = () => setCollapsed((p) => !p);

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
    return ctx;
}