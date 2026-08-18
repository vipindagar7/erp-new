// src/redux/academic/academicSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

const t = (name, fn) => createAsyncThunk(name, async (arg, { rejectWithValue }) => {
  try { return (await fn(arg)).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || "Request failed"); }
});

// ── Department thunks ──────────────────────────────────────────
export const fetchDepartments  = t("dept/fetchAll", (p) => axiosInstance.get(EP.departments.list, { params: p }));
export const createDepartment  = t("dept/create",   (d) => axiosInstance.post(EP.departments.create, d));
export const updateDepartment  = t("dept/update",   ({ id, data }) => axiosInstance.patch(EP.departments.update(id), data));
export const deleteDepartment  = t("dept/delete",   (id) => axiosInstance.delete(EP.departments.delete(id)));
export const bulkUploadDepts   = t("dept/bulk",     (fd) => axiosInstance.post(`${EP.departments.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }));

// ── Branch thunks (NEW) ────────────────────────────────────────
export const fetchBranches     = t("branch/fetchAll", (p) => axiosInstance.get(EP.branches.list, { params: p }));
export const createBranch      = t("branch/create",   (d) => axiosInstance.post(EP.branches.create, d));
export const updateBranch      = t("branch/update",   ({ id, data }) => axiosInstance.patch(EP.branches.update(id), data));
export const deleteBranch      = t("branch/delete",   (id) => axiosInstance.delete(EP.branches.delete(id)));
export const bulkUploadBranches= t("branch/bulk",     (fd) => axiosInstance.post(`${EP.branches.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }));

// ── Program thunks ─────────────────────────────────────────────
export const fetchPrograms     = t("prog/fetchAll", (p) => axiosInstance.get(EP.programs.list, { params: p }));
export const createProgram     = t("prog/create",   (d) => axiosInstance.post(EP.programs.create, d));
export const updateProgram     = t("prog/update",   ({ id, data }) => axiosInstance.patch(EP.programs.update(id), data));
export const deleteProgram     = t("prog/delete",   (id) => axiosInstance.delete(EP.programs.delete(id)));
export const bulkUploadPrograms= t("prog/bulk",     (fd) => axiosInstance.post(`${EP.programs.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }));

// ── Course thunks ──────────────────────────────────────────────
export const fetchCourses      = t("course/fetchAll", (p) => axiosInstance.get(EP.courses.list, { params: p }));
export const createCourse      = t("course/create",   (d) => axiosInstance.post(EP.courses.create, d));
export const updateCourse      = t("course/update",   ({ id, data }) => axiosInstance.patch(EP.courses.update(id), data));
export const deleteCourse      = t("course/delete",   (id) => axiosInstance.delete(EP.courses.delete(id)));
export const bulkUploadCourses = t("course/bulk",     (fd) => axiosInstance.post(`${EP.courses.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }));

// ── Subject thunks ─────────────────────────────────────────────
export const fetchSubjects     = t("subj/fetchAll", (p) => axiosInstance.get(EP.subjects.list, { params: p }));
export const createSubject     = t("subj/create",   (d) => axiosInstance.post(EP.subjects.create, d));
export const updateSubject     = t("subj/update",   ({ id, data }) => axiosInstance.patch(EP.subjects.update(id), data));
export const deleteSubject     = t("subj/delete",   (id) => axiosInstance.delete(EP.subjects.delete(id)));
export const bulkUploadSubjects= t("subj/bulk",     (fd) => axiosInstance.post(`${EP.subjects.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }));

// ── Section thunks ─────────────────────────────────────────────
export const fetchSections     = t("sec/fetchAll",    (p) => axiosInstance.get(EP.sections.list, { params: { status: "ACTIVE", ...p } }));
export const createSection     = t("sec/create",      (d) => axiosInstance.post(EP.sections.create, d));
export const updateSection     = t("sec/update",      ({ id, data }) => axiosInstance.patch(EP.sections.update(id), data));
export const deleteSection     = t("sec/delete",      (id) => axiosInstance.delete(EP.sections.delete(id)));
export const bulkUploadSections= t("sec/bulk",        (fd) => axiosInstance.post(`${EP.sections.list}/bulk-upload`, fd, { headers: { "Content-Type": "multipart/form-data" } }));
export const assignSubject     = t("sec/assign",      ({ id, data }) => axiosInstance.post(EP.sections.assignSubject(id), data));
export const updateSubjectAssign = t("sec/updAssign", ({ id, subId, data }) => axiosInstance.patch(EP.sections.updateSubject(id, subId), data));
export const removeSubjectAssign = t("sec/remAssign", ({ id, subId }) => axiosInstance.delete(EP.sections.removeSubject(id, subId)));
export const bulkAssignSubjects  = t("sec/bulkAssign",(fd) => axiosInstance.post(`${EP.sections.list}/bulk-assign-subjects`, fd, { headers: { "Content-Type": "multipart/form-data" } }));

// ── State helpers ──────────────────────────────────────────────
const entityState = () => ({ list: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 }, loading: false, actionLoading: false, error: null });

const sortActiveFirst = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return [...arr].sort((a, b) => {
    if (a.is_active !== undefined && b.is_active !== undefined) {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
    }
    if (a.status && b.status) {
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
    }
    return (a.name || "").localeCompare(b.name || "");
  });
};

const handleList = (key) => (state, action) => {
  state[key].loading = false;
  const payload = action.payload?.data;
  if (!payload) return;
  const raw = payload[key] || payload.branches || payload.sections || payload.subjects ||
    payload.courses || payload.programs || payload.departments || [];
  state[key].list = sortActiveFirst(raw);
  state[key].pagination = payload.pagination || state[key].pagination;
};

const pending   = (key) => (s) => { s[key].loading = true;       s[key].error = null; };
const rejected  = (key) => (s, a) => { s[key].loading = false;   s[key].error = a.payload; };
const aPending  = (key) => (s) => { s[key].actionLoading = true;  s[key].error = null; };
const aFulfilled= (key) => (s) => { s[key].actionLoading = false; };
const aRejected = (key) => (s, a) => { s[key].actionLoading = false; s[key].error = a.payload; };

const wireThunks = (b, key, ...thunks) => {
  thunks.forEach((thunk) => {
    b.addCase(thunk.pending,   aPending(key))
     .addCase(thunk.fulfilled, aFulfilled(key))
     .addCase(thunk.rejected,  aRejected(key));
  });
};

const academicSlice = createSlice({
  name: "academic",
  initialState: {
    departments: entityState(),
    branches:    entityState(),   // NEW
    programs:    entityState(),
    courses:     entityState(),
    subjects:    entityState(),
    sections:    entityState(),
  },
  reducers: {
    clearError: (s, a) => { if (s[a.payload]) s[a.payload].error = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchDepartments.pending,  pending("departments"))
     .addCase(fetchDepartments.fulfilled,handleList("departments"))
     .addCase(fetchDepartments.rejected, rejected("departments"));
    wireThunks(b, "departments", createDepartment, updateDepartment, deleteDepartment, bulkUploadDepts);

    b.addCase(fetchBranches.pending,     pending("branches"))
     .addCase(fetchBranches.fulfilled,   handleList("branches"))
     .addCase(fetchBranches.rejected,    rejected("branches"));
    wireThunks(b, "branches", createBranch, updateBranch, deleteBranch, bulkUploadBranches);

    b.addCase(fetchPrograms.pending,     pending("programs"))
     .addCase(fetchPrograms.fulfilled,   handleList("programs"))
     .addCase(fetchPrograms.rejected,    rejected("programs"));
    wireThunks(b, "programs", createProgram, updateProgram, deleteProgram, bulkUploadPrograms);

    b.addCase(fetchCourses.pending,      pending("courses"))
     .addCase(fetchCourses.fulfilled,    handleList("courses"))
     .addCase(fetchCourses.rejected,     rejected("courses"));
    wireThunks(b, "courses", createCourse, updateCourse, deleteCourse, bulkUploadCourses);

    b.addCase(fetchSubjects.pending,     pending("subjects"))
     .addCase(fetchSubjects.fulfilled,   handleList("subjects"))
     .addCase(fetchSubjects.rejected,    rejected("subjects"));
    wireThunks(b, "subjects", createSubject, updateSubject, deleteSubject, bulkUploadSubjects);

    b.addCase(fetchSections.pending,     pending("sections"))
     .addCase(fetchSections.fulfilled,   handleList("sections"))
     .addCase(fetchSections.rejected,    rejected("sections"));
    wireThunks(b, "sections", createSection, updateSection, deleteSection, bulkUploadSections,
      assignSubject, updateSubjectAssign, removeSubjectAssign, bulkAssignSubjects);
  },
});

export const { clearError } = academicSlice.actions;
export default academicSlice.reducer;
