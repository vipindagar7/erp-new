import * as svc from "./auth.service.js";

// POST /auth/login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.validatedData;
        const user = await svc.loginUser(email, password);
        const tokens = svc.generateTokens(user.id);
        svc.setTokenCookies(res, tokens);

        // Return full profile so frontend can route by role immediately
        const profile = await svc.getUserWithProfile(user.id);
        return res.status(200).json({ success: true, message: "Logged in successfully", data: profile });
    } catch (e) { next(e); }
};

// POST /auth/logout
export const logout = async (req, res, next) => {
    try {
        svc.clearTokenCookies(res);
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (e) { next(e); }
};

// GET /auth/me
export const me = async (req, res, next) => {
    try {
        const profile = await svc.getUserWithProfile(req.user.id);
        return res.status(200).json({ success: true, data: profile });
    } catch (e) { next(e); }
};

// POST /auth/refresh
export const refresh = async (req, res, next) => {
    try {
        const token = req.cookies?.refresh_token;
        if (!token) {
            return res.status(401).json({ success: false, message: "No refresh token provided" });
        }
        const tokens = await svc.refreshTokens(token);
        svc.setTokenCookies(res, tokens);
        return res.status(200).json({ success: true, message: "Token refreshed" });
    } catch (e) { next(e); }
};
// POST /auth/change-password  (requires authentication)
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await svc.changePassword(req.user.id, currentPassword, newPassword);
        return res.status(200).json({ success: true, message: "Password changed successfully" });
    } catch (e) { next(e); }
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.validatedData;
        await svc.forgotPassword(email);
        // Always return success — never reveal if email exists in the system
        return res.status(200).json({
            success: true,
            message: "If an account with that email exists, a reset link has been sent.",
        });
    } catch (e) { next(e); }
};

// POST /auth/reset-password
export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.validatedData;
        await svc.resetPassword(token, password);
        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now sign in.",
        });
    } catch (e) { next(e); }
};