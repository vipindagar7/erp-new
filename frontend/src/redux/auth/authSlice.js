// src/redux/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

// ── ALL roles go to /admin — unified dashboard ─────────────────
// Permission-based filtering inside the dashboard handles what each role sees
// Simple rule: STUDENT → /student, everyone else → /admin
// No hardcoded role list — works for any dynamically created role
export const getRoleHome = (role) =>
  role === "STUDENT" ? "/student" : "/admin";

// ── Thunks ─────────────────────────────────────────────────────

export const login = createAsyncThunk("auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.login, { email, password });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed.");
    }
  }
);

export const completeFirstLogin = createAsyncThunk("auth/completeFirstLogin",
  async ({ userId, newPassword, confirmPassword, pin, confirmPin }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.firstLogin, { userId, newPassword, confirmPassword, pin, confirmPin });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to set password and PIN.");
    }
  }
);

export const verifyOtp = createAsyncThunk("auth/verifyOtp",
  async ({ userId, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.verifyOtp, { userId, otp });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Invalid or expired code.");
    }
  }
);

export const resendOtp = createAsyncThunk("auth/resendOtp",
  async ({ userId }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(EP.auth.resendOtp, { userId });
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to resend code.");
    }
  }
);

export const logout = createAsyncThunk("auth/logout",
  async () => { try { await axiosInstance.post(EP.auth.logout); } catch { } }
);

export const fetchMe = createAsyncThunk("auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.auth.me);
      return res.data.data;
    } catch {
      return rejectWithValue(null);
    }
  }
);

export const changePassword = createAsyncThunk("auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.changePassword, { currentPassword, newPassword });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to change password.");
    }
  }
);

export const forgotPassword = createAsyncThunk("auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.forgotPassword, { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send reset email.");
    }
  }
);

export const resetPassword = createAsyncThunk("auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.resetPassword, { token, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reset password.");
    }
  }
);

// ── Helpers ────────────────────────────────────────────────────
const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", HOD: "Head of Department",
  FACULTY: "Faculty", CLASS_COORDINATOR: "Class Coordinator",
  STUDENT: "Student", ACCOUNTANT: "Accountant", LIBRARIAN: "Librarian",
  TRAINING_AND_PLACEMENT_OFFICER: "TPO", NON_TEACHING: "Non-Teaching Staff",
  IT_ADMIN: "IT Admin", EXAM_COORDINATOR: "Exam Coordinator",
  CURRICULUM_ADMIN: "Curriculum Admin",
};

const buildDashboards = (user) => {
  if (!user) return [];
  // Collect all roles — primary + extra
  const roles = [user.role, ...(user.extra_roles || [])].filter(Boolean);
  return [...new Set(roles)].map((role) => ({
    role_id: role,
    role_name: role,
    label: ROLE_LABELS[role] ?? role,
    path: getRoleHome(role),
  }));
};

// ── Merge group permissions into user object ───────────────────
// Keeps own permissions separate so UI can show "from group" origin
const mergeGroupPermissions = (user) => {
  if (!user) return user;
  const groupPerms = (user.permissionGroups || [])
    .flatMap(ug => ug?.group?.permissions || ug?.permissions || []);
  const effective = [...new Set([...(user.permissions || []), ...groupPerms])];
  return {
    ...user,
    effectivePermissions: effective,
    groupPermissions: [...new Set(groupPerms)],
  };
};

// A payload is fully logged-in when it has a role and no mid-flow step
const isLoggedInPayload = (payload) =>
  !!payload?.role &&
  payload.step !== "FIRST_LOGIN" &&
  payload.step !== "VERIFY_OTP";

// ── Slice ──────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    initialized: false,
    loading: false,
    error: null,
    loginStep: null,       // "FIRST_LOGIN" | "VERIFY_OTP" | null
    loginUserId: null,
    loginEmail: null,
    activeRole: null,
    dashboards: [],
    impersonating: false,
    impersonatedUser: null,
    adminSnapshot: null,
    impersonationToken: null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
    resetLoginFlow: (s) => { s.loginStep = null; s.loginUserId = null; s.loginEmail = null; s.error = null; },
    setActiveRole: (s, a) => {
      const { role, permissions, scope } = a.payload;
      s.activeRole = role;
      if (s.user) {
        s.user.role = role;
        s.user.permissions = permissions ?? s.user.permissions;
        s.user.scope = scope ?? {};
      }
    },
    startImpersonation: (s, a) => {
      const { token, user, admin } = a.payload;
      s.adminSnapshot = admin;
      s.impersonatedUser = user;
      s.impersonationToken = token;
      s.impersonating = true;
      s.user = mergeGroupPermissions(user);
    },
    stopImpersonation: (s) => {
      s.user = s.adminSnapshot;
      s.impersonating = false;
      s.impersonatedUser = null;
      s.adminSnapshot = null;
      s.impersonationToken = null;
    },
  },
  extraReducers: (b) => {
    const handleStepPayload = (s, payload) => {
      s.loading = false;
      if (isLoggedInPayload(payload)) {
        s.user = mergeGroupPermissions(payload);
        s.dashboards = buildDashboards(payload);
        s.activeRole = payload?.role ?? null;
        s.loginStep = null;
        s.loginUserId = null;
        s.loginEmail = null;
        return;
      }
      // Mid-flow step (OTP / first login)
      s.loginStep = payload?.step ?? null;
      s.loginUserId = payload?.userId ?? s.loginUserId;
      s.loginEmail = payload?.email ?? s.loginEmail;
    };

    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => handleStepPayload(s, a.payload))
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(completeFirstLogin.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(completeFirstLogin.fulfilled, (s, a) => handleStepPayload(s, a.payload))
      .addCase(completeFirstLogin.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(verifyOtp.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(verifyOtp.fulfilled, (s, a) => handleStepPayload(s, a.payload))
      .addCase(verifyOtp.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(resendOtp.rejected, (s, a) => { s.error = a.payload; });

    b.addCase(logout.fulfilled, (s) => {
      s.user = null;
      s.initialized = true;
      s.dashboards = [];
      s.activeRole = null;
      s.loginStep = null;
      s.loginUserId = null;
      s.loginEmail = null;
      s.impersonating = false;
      s.impersonatedUser = null;
      s.adminSnapshot = null;
      s.impersonationToken = null;
    });

    b.addCase(fetchMe.pending, (s) => { s.loading = true; })
      .addCase(fetchMe.fulfilled, (s, a) => {
        if (!s.impersonating) {
          s.user = mergeGroupPermissions(a.payload);
          s.dashboards = buildDashboards(a.payload);
          s.activeRole = s.activeRole ?? a.payload?.role ?? null;
        }
        s.loading = false;
        s.initialized = true;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null;
        s.loading = false;
        s.initialized = true;
      });

    b.addCase(changePassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(changePassword.fulfilled, (s) => { s.loading = false; })
      .addCase(changePassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(forgotPassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(forgotPassword.fulfilled, (s) => { s.loading = false; })
      .addCase(forgotPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(resetPassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(resetPassword.fulfilled, (s) => { s.loading = false; })
      .addCase(resetPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const {
  clearError, resetLoginFlow, setActiveRole,
  startImpersonation, stopImpersonation,
} = authSlice.actions;

export default authSlice.reducer;