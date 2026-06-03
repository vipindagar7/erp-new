import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

/**
 * authenticate — verifies access_token cookie, attaches req.user.
 * Also handles X-Impersonate-Token header for admin impersonation sessions.
 */
export const authenticate = async (req, res, next) => {
    try {
        // ── Impersonation path — short-lived token sent in header ──
        const impersonateToken = req.headers["x-impersonate-token"];
        if (impersonateToken) {
            let payload;
            try {
                payload = jwt.verify(impersonateToken, process.env.JWT_ACCESS_SECRET);
            } catch {
                return res.status(401).json({ success: false, message: "Impersonation token expired or invalid. Please exit and try again." });
            }

            // payload.impersonatedBy = adminId — the admin who initiated the session
            if (!payload.impersonatedBy) {
                return res.status(401).json({ success: false, message: "Invalid impersonation token" });
            }

            const user = await prisma.user.findUnique({ where: { id: payload.id } });
            if (!user) return res.status(401).json({ success: false, message: "User not found" });
            if (user.isBlocked) return res.status(403).json({ success: false, message: "This account is blocked" });

            req.user = {
                ...user,
                extra_roles: user.extra_roles || [],
                permissions: user.permissions || [],
                impersonatedBy: payload.impersonatedBy,  // attach for audit logs
            };
            return next();
        }

        // ── Normal cookie path ─────────────────────────────────────
        const token = req.cookies?.access_token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (!user) return res.status(401).json({ success: false, message: "User not found" });
        if (user.isBlocked) return res.status(403).json({ success: false, message: "Your account has been blocked. Contact admin." });

        req.user = {
            ...user,
            extra_roles: user.extra_roles || [],
            permissions: user.permissions || [],
        };
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * authorize(...roles) — checks primary role AND extra_roles.
 * Usage: authorize("ADMIN", "SUPER_ADMIN")
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const userRoles = [req.user.role, ...(req.user.extra_roles || [])];
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
        return res.status(403).json({
            success: false,
            message: `Access denied. Required: ${allowedRoles.join(" or ")}`,
        });
    }
    next();
};

/**
 * requirePermission(key) — checks req.user.permissions array.
 * SUPER_ADMIN always passes regardless of permissions.
 */
export const requirePermission = (key) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (req.user.role === "SUPER_ADMIN") return next();
    if (!req.user.permissions?.includes(key)) {
        return res.status(403).json({ success: false, message: `Permission required: ${key}` });
    }
    next();
};