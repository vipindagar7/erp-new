import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";

const handle = (fn) => async (arg, { rejectWithValue }) => {
  try { return (await fn(arg)).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || e.message); }
};

export const fetchFaculty       = createAsyncThunk("faculty/fetchAll",    handle((p) => axiosInstance.get(EP.faculty.list, { params: p })));
export const fetchFacultyById   = createAsyncThunk("faculty/fetchById",   handle((id) => axiosInstance.get(EP.faculty.byId(id))));
export const fetchFacultyMe     = createAsyncThunk("faculty/me",          handle(() => axiosInstance.get(EP.faculty.me || "/faculty/me")));
export const createFaculty      = createAsyncThunk("faculty/create",      handle((d) => axiosInstance.post(EP.faculty.create, d)));
export const updateFaculty      = createAsyncThunk("faculty/update",      handle(({ id, data }) => axiosInstance.patch(EP.faculty.update(id), data)));
export const deleteFaculty      = createAsyncThunk("faculty/delete",      handle((id) => axiosInstance.delete(EP.faculty.delete(id))));
export const toggleBlockFaculty = createAsyncThunk("faculty/block",       handle(({ id, isBlocked }) => axiosInstance.patch(EP.faculty.block(id), { isBlocked })));
export const assignSubjects     = createAsyncThunk("faculty/assign",      handle(({ id, subject_ids }) => axiosInstance.put(EP.faculty.assignSubjects(id), { subject_ids })));

const facultySlice = createSlice({
  name: "faculty",
  initialState: {
    list:          [],
    pagination:    { total: 0, page: 1, limit: 20, pages: 0 },
    selected:      null,
    myProfile:     null,
    loading:       false,
    actionLoading: false,
    error:         null,
  },
  reducers: {
    clearError:    (s) => { s.error = null; },
    clearSelected: (s) => { s.selected = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchFaculty.pending,   (s) => { s.loading = true; s.error = null; })
     .addCase(fetchFaculty.fulfilled, (s, a) => {
       s.loading    = false;
       s.list       = a.payload.data?.faculty    || [];
       s.pagination = a.payload.data?.pagination || s.pagination;
     })
     .addCase(fetchFaculty.rejected,  (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(fetchFacultyById.fulfilled, (s, a) => { s.selected   = a.payload.data; });
    b.addCase(fetchFacultyMe.fulfilled,   (s, a) => { s.myProfile  = a.payload.data; });

    const mutators = [createFaculty, updateFaculty, deleteFaculty, toggleBlockFaculty, assignSubjects];
    mutators.forEach((t) => {
      b.addCase(t.pending,   (s) => { s.actionLoading = true;  s.error = null; })
       .addCase(t.fulfilled, (s) => { s.actionLoading = false; })
       .addCase(t.rejected,  (s, a) => { s.actionLoading = false; s.error = a.payload; });
    });
  },
});

export const { clearError, clearSelected } = facultySlice.actions;
export default facultySlice.reducer;
