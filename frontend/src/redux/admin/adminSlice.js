// frontend/src/redux/admin/adminSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

export const fetchDashboardStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.admin.stats);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  "admin/fetchActivity",
  async (limit = 20, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.admin.activity, { params: { limit } });
      return res.data.activities;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: null,
    activity: [],
    loading: false,
    activityLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (s, a) => { s.loading = false; s.stats = a.payload; })
      .addCase(fetchDashboardStats.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchRecentActivity.pending, (s) => { s.activityLoading = true; })
      .addCase(fetchRecentActivity.fulfilled, (s, a) => { s.activityLoading = false; s.activity = a.payload; })
      .addCase(fetchRecentActivity.rejected, (s) => { s.activityLoading = false; });
  },
});

export default adminSlice.reducer;
