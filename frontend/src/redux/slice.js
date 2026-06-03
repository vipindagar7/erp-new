import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../lib/axios.js";

// ── helpers ──────────────────────────────────────────────────────────────────
const get = (url, params) => axiosInstance.get(url, { params }).then((r) => r.data);

const sortActiveFirst = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return [...arr].sort((a, b) => {
    if (a.is_active !== undefined) {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
    }
    return (a.name || a.question || "").localeCompare(b.name || b.question || "");
  });
};
const post = (url, data) => axiosInstance.post(url, data).then((r) => r.data);
const patch = (url, data) => axiosInstance.patch(url, data).then((r) => r.data);
const del = (url) => axiosInstance.delete(url).then((r) => r.data);

// ── PROGRAMS ─────────────────────────────────────────────────────────────────
export const programActions = {
  getAll: createAsyncThunk("program/getAll", async (p, { rejectWithValue }) => { try { return await get("/programs", p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  create: createAsyncThunk("program/create", async (d, { rejectWithValue }) => { try { return await post("/programs", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  update: createAsyncThunk("program/update", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/programs/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  remove: createAsyncThunk("program/remove", async (id, { rejectWithValue }) => { try { return await del(`/programs/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
};

const programSlice = createSlice({
  name: "program",
  initialState: { items: [], pagination: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(programActions.getAll.pending, (s) => { s.loading = true; })
      .addCase(programActions.getAll.fulfilled, (s, a) => { s.items = a.payload.data?.programs || []; s.pagination = a.payload.data?.pagination; s.loading = false; })
      .addCase(programActions.getAll.rejected, (s) => { s.loading = false; });
  },
});

// ── COURSES ──────────────────────────────────────────────────────────────────
export const courseActions = {
  getAll: createAsyncThunk("course/getAll", async (p, { rejectWithValue }) => { try { return await get("/courses", p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  create: createAsyncThunk("course/create", async (d, { rejectWithValue }) => { try { return await post("/courses", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  update: createAsyncThunk("course/update", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/courses/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  remove: createAsyncThunk("course/remove", async (id, { rejectWithValue }) => { try { return await del(`/courses/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
};

const courseSlice = createSlice({
  name: "course",
  initialState: { items: [], pagination: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(courseActions.getAll.pending, (s) => { s.loading = true; })
      .addCase(courseActions.getAll.fulfilled, (s, a) => { s.items = a.payload.data?.courses || []; s.pagination = a.payload.data?.pagination; s.loading = false; })
      .addCase(courseActions.getAll.rejected, (s) => { s.loading = false; });
  },
});

// ── SECTIONS ─────────────────────────────────────────────────────────────────
export const sectionActions = {
  getAll: createAsyncThunk("section/getAll", async (p, { rejectWithValue }) => { try { return await get("/sections", p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  create: createAsyncThunk("section/create", async (d, { rejectWithValue }) => { try { return await post("/sections", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  update: createAsyncThunk("section/update", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/sections/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  remove: createAsyncThunk("section/remove", async (id, { rejectWithValue }) => { try { return await del(`/sections/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  assignSubject: createAsyncThunk("section/assignSubject", async ({ id, data }, { rejectWithValue }) => { try { return await post(`/sections/${id}/subjects`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  removeSubject: createAsyncThunk("section/removeSubject", async ({ id, subject_id }, { rejectWithValue }) => { try { return await del(`/sections/${id}/subjects/${subject_id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  updateSubjectFaculty: createAsyncThunk("section/updateSubjectFaculty", async ({ id, subject_id, data }, { rejectWithValue }) => { try { return await patch(`/sections/${id}/subjects/${subject_id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
};

const sectionSlice = createSlice({
  name: "section",
  initialState: { items: [], pagination: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(sectionActions.getAll.pending, (s) => { s.loading = true; })
      .addCase(sectionActions.getAll.fulfilled, (s, a) => { s.items = sortActiveFirst(a.payload.data?.sections || []); s.pagination = a.payload.data?.pagination; s.loading = false; })
      .addCase(sectionActions.getAll.rejected, (s) => { s.loading = false; });
  },
});

// ── SUBJECTS ─────────────────────────────────────────────────────────────────
export const subjectActions = {
  getAll: createAsyncThunk("subject/getAll", async (p, { rejectWithValue }) => { try { return await get("/subjects", p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  create: createAsyncThunk("subject/create", async (d, { rejectWithValue }) => { try { return await post("/subjects", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  update: createAsyncThunk("subject/update", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/subjects/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
  remove: createAsyncThunk("subject/remove", async (id, { rejectWithValue }) => { try { return await del(`/subjects/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } }),
};

const subjectSlice = createSlice({
  name: "subject",
  initialState: { items: [], pagination: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(subjectActions.getAll.pending, (s) => { s.loading = true; })
      .addCase(subjectActions.getAll.fulfilled, (s, a) => { s.items = sortActiveFirst(a.payload.data?.subjects || []); s.pagination = a.payload.data?.pagination; s.loading = false; })
      .addCase(subjectActions.getAll.rejected, (s) => { s.loading = false; });
  },
});

// ── FEEDBACK ─────────────────────────────────────────────────────────────────
export const getCategories = createAsyncThunk("sharedFeedback/getCategories", async (_, { rejectWithValue }) => { try { return await get("/feedback/categories"); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createCategory = createAsyncThunk("sharedFeedback/createCategory", async (d, { rejectWithValue }) => { try { return await post("/feedback/categories", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateCategory = createAsyncThunk("sharedFeedback/updateCategory", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/feedback/categories/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteCategory = createAsyncThunk("sharedFeedback/deleteCategory", async (id, { rejectWithValue }) => { try { return await del(`/feedback/categories/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const getQuestions = createAsyncThunk("sharedFeedback/getQuestions", async (cat_id, { rejectWithValue }) => { try { return await get("/feedback/questions", { category_id: cat_id }); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createQuestion = createAsyncThunk("sharedFeedback/createQuestion", async (d, { rejectWithValue }) => { try { return await post("/feedback/questions", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateQuestion = createAsyncThunk("sharedFeedback/updateQuestion", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/feedback/questions/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteQuestion = createAsyncThunk("sharedFeedback/deleteQuestion", async (id, { rejectWithValue }) => { try { return await del(`/feedback/questions/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const getForms = createAsyncThunk("sharedFeedback/getForms", async (p, { rejectWithValue }) => { try { return await get("/feedback/forms", p); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const createForm = createAsyncThunk("sharedFeedback/createForm", async (d, { rejectWithValue }) => { try { return await post("/feedback/forms", d); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const updateForm = createAsyncThunk("sharedFeedback/updateForm", async ({ id, data }, { rejectWithValue }) => { try { return await patch(`/feedback/forms/${id}`, data); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const deleteForm = createAsyncThunk("sharedFeedback/deleteForm", async (id, { rejectWithValue }) => { try { return await del(`/feedback/forms/${id}`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });
export const getFormResults = createAsyncThunk("sharedFeedback/getResults", async (form_id, { rejectWithValue }) => { try { return await get(`/feedback/forms/${form_id}/results`); } catch (e) { return rejectWithValue(e.response?.data?.message || e.message); } });

const feedbackSlice = createSlice({
  name: "feedback",
  initialState: { categories: [], questions: [], forms: [], results: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(getCategories.pending, (s) => { s.loading = true; })
      .addCase(getCategories.fulfilled, (s, a) => {
        s.categories = sortActiveFirst(
          Array.isArray(a.payload.data?.categories) ? a.payload.data.categories :
            Array.isArray(a.payload.data) ? a.payload.data :
              []
        ); s.loading = false;
      })
      .addCase(getCategories.rejected, (s) => { s.loading = false; })
      .addCase(createCategory.fulfilled, (s, a) => {
        const cat = a.payload?.data ?? a.payload;
        if (cat?.id) s.categories = sortActiveFirst([cat, ...s.categories.filter((c) => c.id !== cat.id)]);
      })
      .addCase(updateCategory.fulfilled, (s, a) => {
        const cat = a.payload?.data ?? a.payload;
        if (cat?.id) { const i = s.categories.findIndex((c) => c.id === cat.id); if (i !== -1) s.categories[i] = cat; }
      })
      .addCase(deleteCategory.fulfilled, (s, a) => {
        const id = a.payload?.id ?? a.meta.arg;
        s.categories = s.categories.filter((c) => c.id !== id);
      })
      .addCase(createQuestion.fulfilled, (s, a) => {
        const q = a.payload?.data ?? a.payload;
        if (q?.id) s.questions = sortActiveFirst([...s.questions, q]);
      })
      .addCase(updateQuestion.fulfilled, (s, a) => {
        const q = a.payload?.data ?? a.payload;
        if (q?.id) { const i = s.questions.findIndex((x) => x.id === q.id); if (i !== -1) s.questions[i] = q; }
      })
      .addCase(deleteQuestion.fulfilled, (s, a) => {
        const id = a.payload?.id ?? a.meta.arg;
        s.questions = s.questions.filter((q) => q.id !== id);
      })
      .addCase(getQuestions.fulfilled, (s, a) => {
        const rawQ = Array.isArray(a.payload.data?.questions) ? a.payload.data.questions :
          Array.isArray(a.payload.data) ? a.payload.data : [];
        s.questions = [...rawQ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      })
      .addCase(getForms.pending, (s) => { s.loading = true; })
      .addCase(getForms.fulfilled, (s, a) => { s.forms = sortActiveFirst(a.payload.data?.forms ?? a.payload.data?.data?.forms ?? []); s.loading = false; })
      .addCase(getForms.rejected, (s) => { s.loading = false; })
      .addCase(createForm.fulfilled, (s, a) => {
        const f = a.payload?.data ?? a.payload;
        if (f?.id) s.forms = sortActiveFirst([f, ...s.forms.filter((x) => x.id !== f.id)]);
      })
      .addCase(updateForm.fulfilled, (s, a) => {
        const f = a.payload?.data ?? a.payload;
        if (f?.id) { const i = s.forms.findIndex((x) => x.id === f.id); if (i !== -1) s.forms[i] = f; else s.forms.unshift(f); }
      })
      .addCase(deleteForm.fulfilled, (s, a) => {
        const id = a.payload?.id ?? a.meta.arg;
        s.forms = s.forms.filter((f) => f.id !== id);
      })
      .addCase(getFormResults.pending, (s) => { s.loading = true; s.results = null; })
      .addCase(getFormResults.fulfilled, (s, a) => {
        const raw = a.payload?.data?.data ?? a.payload?.data ?? a.payload;
        // Normalize: if new shape { form, responses, question_stats } → flatten to old shape
        if (raw?.form) {
          s.results = {
            ...raw.form,
            responses: raw.responses ?? [],
            question_stats: raw.question_stats ?? [],
            _count: { responses: raw.total_responses ?? raw.responses?.length ?? 0 },
          };
        } else {
          s.results = raw;
        }
        s.loading = false;
      })
      .addCase(getFormResults.rejected, (s) => { s.loading = false; });
  },
});

// Export combined reducers for store
const sharedReducer = {
  program: programSlice.reducer,
  course: courseSlice.reducer,
  section: sectionSlice.reducer,
  subject: subjectSlice.reducer,
  feedback: feedbackSlice.reducer,
};

export default sharedReducer;