import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchMe } from "./redux/auth/authSlice.js";
import { router } from "./router.jsx";
import LockScreen from "./components/shared/LockScreen.jsx";

export default function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth ?? {});
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  // ── Global session-lock listener ───────────────────────────
  // axios.js dispatches "erp:session-locked" whenever any API call
  // returns 423 (auto-locked after inactivity). This was previously
  // missing entirely — the event fired into nothing and the lock
  // screen never appeared, leaving the user stuck with every
  // subsequent request silently failing.
  useEffect(() => {
    const handler = () => setLocked(true);
    window.addEventListener("erp:session-locked", handler);
    return () => window.removeEventListener("erp:session-locked", handler);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
      {locked && user && (
        <LockScreen onUnlocked={() => setLocked(false)} />
      )}
    </TooltipProvider>
  );
}