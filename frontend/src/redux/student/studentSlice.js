import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";

const api = (method, url, data, params) =>
  axiosInstance({ method, url, data, params }).then((r) => r.data);

// ── Thunks ─────────────────────────────────────────────────────
export const fetchStudents = createAsyncThunk("student/fetchAll", async (p, { rejectWithValue }) => { try { return await api("get", "/students", null, p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const getStudents = fetchStudents; // alias for old page

export const createStudent = createAsyncThunk("student/create", async (d, { rejectWithValue }) => { try { return await api("post", "/students", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateStudent = createAsyncThunk("student/update", async ({ id, data }, { rejectWithValue }) => { try { return await api("patch", `/students/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteStudent = createAsyncThunk("student/delete", async (id, { rejectWithValue }) => { try { return await api("delete", `/students/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const bulkDeleteStudents = createAsyncThunk("student/bulkDelete", async (ids, { rejectWithValue }) => { try { return await api("post", "/students/bulk-delete", { ids }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

export const toggleBlockStudent = createAsyncThunk("student/toggleBlock", async ({ id, isBlocked }, { rejectWithValue }) => { try { return await api("patch", `/students/${id}/block`, { isBlocked }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const toggleStudentBlock = toggleBlockStudent; // alias
export const bulkBlockStudents = createAsyncThunk("student/bulkBlock", async ({ ids, isBlocked }, { rejectWithValue }) => { try { return await api("post", "/students/bulk-block", { ids, isBlocked }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

export const setStudentStatus = createAsyncThunk("student/setStatus", async ({ id, status, remarks }, { rejectWithValue }) => { try { return await api("patch", `/students/${id}/enrollment-status`, { status, remarks }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateEnrollmentStatus = setStudentStatus; // alias
export const bulkSetStatus = createAsyncThunk("student/bulkStatus", async ({ ids, status, remarks }, { rejectWithValue }) => { try { return await api("patch", "/students/bulk-enrollment-status", { ids, status, remarks }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const bulkEnrollmentStatus = bulkSetStatus; // alias

export const promoteStudent = createAsyncThunk("student/promote", async ({ id }, { rejectWithValue }) => { try { return await api("post", `/students/${id}/promote`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const demoteStudent = createAsyncThunk("student/demote",      async ({ id }, { rejectWithValue })         => { try { return await api("post",   `/students/${id}/demote`);                                    } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const bulkPromoteStudents = createAsyncThunk("student/bulkPromote", async ({ ids }, { rejectWithValue }) => { try { return await api("post", "/students/bulk-promote/section", { ids }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

export const changeSection = createAsyncThunk("student/changeSection", async ({ id, new_section_id, remarks }, { rejectWithValue }) => { try { return await api("patch", `/students/${id}/section`, { section_id: new_section_id, remarks }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const changeStudentSection = changeSection; // alias
export const bulkDemoteStudents = createAsyncThunk("student/bulkDemote", async ({ ids }, { rejectWithValue }) => { try { return await api("post", "/students/bulk-demote", { ids }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

export const bulkChangeSection = createAsyncThunk("student/bulkSection", async ({ ids, new_section_id, remarks }, { rejectWithValue }) => { try { return await api("post", "/students/bulk-change-section", { ids, section_id: new_section_id, remarks }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

export const bulkPromoteSection = createAsyncThunk("student/bulkSection2", async (data, { rejectWithValue }) => { try { return await api("post", "/students/bulk-promote/section", data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const bulkPromoteInstitution = createAsyncThunk("student/bulkInstitution", async (data, { rejectWithValue }) => { try { return await api("post", "/students/bulk-promote/institution", data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

export const clearError = () => ({ type: "student/clearError" });

// ── Slice ───────────────────────────────────────────────────────
const studentSlice = createSlice({
  name: "student",
  initialState: {
    items: [],   // old page reads s.student.items
    list: [],   // new page reads s.student.list (via s.students alias in store)
    pagination: { total: 0, page: 1, limit: 10, pages: 0 },
    loading: false,
    actionLoading: false,
    bulkLoading: false,
    error: null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    const pend = (s) => { s.loading = true; s.error = null; };
    const rej = (s, a) => { s.loading = false; s.error = a.payload; };
    const aP = (s) => { s.actionLoading = true; s.error = null; };
    const aF = (s) => { s.actionLoading = false; };
    const aR = (s, a) => { s.actionLoading = false; s.error = a.payload; };

    b
      .addCase(fetchStudents.pending, pend)
      .addCase(fetchStudents.fulfilled, (s, a) => {
        s.loading = false;
        const d = a.payload?.data;
        // Support both response shapes
        const students = d?.students ?? d?.items ?? (Array.isArray(d) ? d : []);
        // Sort: students with ACTIVE enrollment first
        const sorted = [...students].sort((a, b) => {
          const aEnr = a.enrollments?.find((e) => e.is_current) || a.studentEnrollments?.find((e) => e.is_current);
          const bEnr = b.enrollments?.find((e) => e.is_current) || b.studentEnrollments?.find((e) => e.is_current);
          const aActive = aEnr?.status === "ACTIVE" ? 0 : 1;
          const bActive = bEnr?.status === "ACTIVE" ? 0 : 1;
          if (aActive !== bActive) return aActive - bActive;
          return (a.name || "").localeCompare(b.name || "");
        });
        s.items = sorted;  // old page
        s.list = sorted;  // new page
        s.pagination = d?.pagination ?? s.pagination;
      })
      .addCase(fetchStudents.rejected, rej);

    [
      createStudent, updateStudent, deleteStudent, bulkDeleteStudents,
      toggleBlockStudent, bulkBlockStudents,
      setStudentStatus, bulkSetStatus,
      promoteStudent, demoteStudent, bulkPromoteStudents,
      changeSection, bulkChangeSection,
      bulkPromoteSection, bulkPromoteInstitution,
    ].forEach((t) => {
      b.addCase(t.pending, aP).addCase(t.fulfilled, aF).addCase(t.rejected, aR);
    });
  },
});

export default studentSlice.reducer;