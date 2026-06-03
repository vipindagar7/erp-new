import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { fetchMe } from "../../redux/auth/authSlice.js";

/**
 * AppInitializer — root layout component that wraps the entire router tree.
 *
 * Why here and not in main.jsx or App.jsx?
 * - main.jsx: RouterProvider hasn't mounted yet, so useDispatch won't work.
 * - App.jsx wrapping RouterProvider: App remounts on certain navigations,
 *   causing fetchMe to fire multiple times → reload loop.
 *
 * Being inside the router as the root layout means:
 * - It mounts exactly once when the app loads.
 * - It never remounts on route changes (layouts persist across child routes).
 * - fetchMe fires once, sets initialized=true, guards unblock.
 */
export default function AppInitializer() {
    const dispatch = useDispatch();
    const called = useRef(false);

    useEffect(() => {
        // useRef guard prevents double-fire in React StrictMode (dev double-mount)
        if (called.current) return;
        called.current = true;
        dispatch(fetchMe());
    }, []);

    // Render all child routes unchanged
    return <Outlet />;
}