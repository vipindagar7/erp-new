import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

// ─── Role → home route map ────────────────────────────────────
export const ROLE_HOME = {
  SUPER_ADMIN: "/admin",
  ADMIN: "/admin",
  FACULTY: "/faculty",
  STUDENT: "/student",
};

export const getRoleHome = (role) => ROLE_HOME[role] ?? "/login";

// ─── Thunks ───────────────────────────────────────────────────

export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.login, { email, password });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed. Please try again.");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try { await axiosInstance.post(EP.auth.logout); } catch { }
  }
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.auth.me);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(null);
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.changePassword, { currentPassword, newPassword });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to change password.");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.forgotPassword, { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send reset email.");
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.auth.resetPassword, { token, password });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reset password.");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    initialized: false,
    loading: false,
    error: null,
    // ── Impersonation ──
    impersonating: false,
    impersonatedUser: null,   // the user being viewed as
    adminSnapshot: null,   // original admin saved here while impersonating
    impersonationToken: null,   // short-lived JWT sent in X-Impersonate-Token header
  },
  reducers: {
    clearError: (s) => { s.error = null; },

    // Called by AdminUserActions after a successful /impersonate API call
    startImpersonation: (s, a) => {
      const { token, user, admin } = a.payload;
      s.adminSnapshot = admin;   // save real admin so we can restore
      s.impersonatedUser = user;
      s.impersonationToken = token;
      s.impersonating = true;
      s.user = user;    // swap visible user to impersonated
    },

    // Called by ImpersonationBanner "Exit" button
    stopImpersonation: (s) => {
      s.user = s.adminSnapshot;
      s.impersonating = false;
      s.impersonatedUser = null;
      s.adminSnapshot = null;
      s.impersonationToken = null;
    },
  },
  extraReducers: (b) => {
    // ── login ──
    b.addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // ── logout — clear everything including impersonation ──
    b.addCase(logout.fulfilled, (s) => {
      s.user = null; s.initialized = true;
      s.impersonating = false; s.impersonatedUser = null;
      s.adminSnapshot = null; s.impersonationToken = null;
    });

    // ── fetchMe — skip if currently impersonating ──
    b.addCase(fetchMe.pending, (s) => { s.loading = true; })
      .addCase(fetchMe.fulfilled, (s, a) => {
        if (!s.impersonating) s.user = a.payload; // don't overwrite impersonated user
        s.loading = false; s.initialized = true;
      })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.loading = false; s.initialized = true; });

    // ── changePassword ──
    b.addCase(changePassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(changePassword.fulfilled, (s) => { s.loading = false; })
      .addCase(changePassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // ── forgotPassword ──
    b.addCase(forgotPassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(forgotPassword.fulfilled, (s) => { s.loading = false; })
      .addCase(forgotPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    // ── resetPassword ──
    b.addCase(resetPassword.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(resetPassword.fulfilled, (s) => { s.loading = false; })
      .addCase(resetPassword.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export const { clearError, startImpersonation, stopImpersonation } = authSlice.actions;
export default authSlice.reducer;