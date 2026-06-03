// frontend/src/redux/notification/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.notifications.list, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/unreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.notifications.unreadCount);
      return res.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.patch(EP.notifications.markRead(id));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.patch(EP.notifications.markAllRead);
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(EP.notifications.delete(id));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message ?? "Failed");
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    pagination: {},
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload.notifications ?? [];
        s.pagination = a.payload.pagination ?? {};
      })
      .addCase(fetchNotifications.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchUnreadCount.fulfilled, (s, a) => { s.unreadCount = a.payload; })

      .addCase(markNotificationRead.fulfilled, (s, a) => {
        const n = s.list.find((x) => x.id === a.payload);
        if (n) { n.is_read = true; s.unreadCount = Math.max(0, s.unreadCount - 1); }
      })
      .addCase(markAllNotificationsRead.fulfilled, (s) => {
        s.list.forEach((n) => { n.is_read = true; });
        s.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (s, a) => {
        const removed = s.list.find((x) => x.id === a.payload);
        if (removed && !removed.is_read) s.unreadCount = Math.max(0, s.unreadCount - 1);
        s.list = s.list.filter((x) => x.id !== a.payload);
      });
  },
});

export default notificationSlice.reducer;
