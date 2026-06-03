import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchMe } from "./redux/auth/authSlice.js";
import { router } from "./router.jsx";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}