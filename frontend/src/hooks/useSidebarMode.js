// src/hooks/useSidebarMode.js
// Manages toggle between main nav and module-specific nav.
// Persists choice in sessionStorage so it survives hot-reload.
import { useState, useCallback } from "react";

export const SIDEBAR_MODE = {
  MAIN:   "main",
  MODULE: "module",
};

export function useSidebarMode(defaultMode = SIDEBAR_MODE.MAIN) {
  const [mode, setMode] = useState(() => {
    try { return sessionStorage.getItem("sidebar_mode") || defaultMode; }
    catch { return defaultMode; }
  });

  const setMain   = useCallback(() => { setMode(SIDEBAR_MODE.MAIN);   try { sessionStorage.setItem("sidebar_mode", SIDEBAR_MODE.MAIN);   } catch {} }, []);
  const setModule = useCallback(() => { setMode(SIDEBAR_MODE.MODULE); try { sessionStorage.setItem("sidebar_mode", SIDEBAR_MODE.MODULE); } catch {} }, []);
  const toggle    = useCallback(() => { setMode((m) => { const next = m === SIDEBAR_MODE.MAIN ? SIDEBAR_MODE.MODULE : SIDEBAR_MODE.MAIN; try { sessionStorage.setItem("sidebar_mode", next); } catch {} return next; }); }, []);

  return { mode, isMain: mode === SIDEBAR_MODE.MAIN, isModule: mode === SIDEBAR_MODE.MODULE, setMain, setModule, toggle };
}
