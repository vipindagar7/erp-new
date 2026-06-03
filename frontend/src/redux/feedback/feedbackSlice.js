import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { extractList, extractItem, extractPagination } from "../../lib/apiResponse.js";

// ── Categories ────────────────────────────────────────────────
export const fetchCategories = createAsyncThunk(
  "feedback/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.feedback.categories);
      return extractList(res.data, "categories");
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const createCategory = createAsyncThunk(
  "feedback/createCategory",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.feedback.categories, data);
      return extractItem(res.data, "category") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const updateCategory = createAsyncThunk(
  "feedback/updateCategory",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(EP.feedback.categoryById(id), data);
      return extractItem(res.data, "category") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const deleteCategory = createAsyncThunk(
  "feedback/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(EP.feedback.categoryById(id));
      return id;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);

// ── Questions ─────────────────────────────────────────────────
export const fetchQuestions = createAsyncThunk(
  "feedback/fetchQuestions",
  async (params, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.feedback.questions, {
        params: params ? (typeof params === "string" ? { category_id: params } : params) : {},
      });
      return extractList(res.data, "questions");
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const createQuestion = createAsyncThunk(
  "feedback/createQuestion",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(EP.feedback.questions, data);
      return extractItem(res.data, "question") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const updateQuestion = createAsyncThunk(
  "feedback/updateQuestion",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(EP.feedback.questionById(id), data);
      return extractItem(res.data, "question") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const deleteQuestion = createAsyncThunk(
  "feedback/deleteQuestion",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(EP.feedback.questionById(id));
      return id;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);

// ── Forms ─────────────────────────────────────────────────────
export const fetchForms = createAsyncThunk(
  "feedback/fetchForms",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.feedback.forms, { params });
      return {
        forms: extractList(res.data, "forms"),
        pagination: extractPagination(res.data),
      };
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const toggleFormActive = createAsyncThunk(
  "feedback/toggleFormActive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(EP.feedback.toggleActive(id));
      return extractItem(res.data, "form") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const deleteForm = createAsyncThunk(
  "feedback/deleteForm",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(EP.feedback.formById(id));
      return id;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const deleteFormResponses = createAsyncThunk(
  "feedback/deleteFormResponses",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${EP.feedback.formById(id)}/responses`);
      return id;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const updateActionTaken = createAsyncThunk(
  "feedback/updateActionTaken",
  async ({ id, action_taken }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(EP.feedback.formAction(id), { action_taken });
      return extractItem(res.data, "form") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);

// ── Student ───────────────────────────────────────────────────
export const fetchMyForms = createAsyncThunk(
  "feedback/fetchMyForms",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.feedback.myForms);
      // API returns { success, data: [...] } — data is a direct array
      const d = res.data?.data;
      return Array.isArray(d) ? d : extractList(res.data, "forms");
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);
export const submitFeedback = createAsyncThunk(
  "feedback/submitFeedback",
  async ({ formId, form_id, answers }, { rejectWithValue }) => {
    try {
      const id = formId || form_id;
      const res = await axiosInstance.post(EP.feedback.submit(id), { answers });
      return extractItem(res.data, "response") ?? res.data?.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);

// ── Results ───────────────────────────────────────────────────
export const fetchFormResults = createAsyncThunk(
  "feedback/fetchFormResults",
  async (formId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(EP.feedback.results(formId));
      return res.data;
    } catch (err) { return rejectWithValue(err.response?.data?.message ?? "Failed"); }
  }
);

// ── Slice ─────────────────────────────────────────────────────
const feedbackSlice = createSlice({
  name: "studentFeedback",
  initialState: {
    categories: [],
    questions: [],
    forms: [],
    pagination: {},
    myForms: [],
    selectedForm: null,
    results: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearResults: (s) => { s.results = null; },
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    const pend = (s) => { s.loading = true; s.error = null; };
    const rej = (s, a) => { s.loading = false; s.error = a.payload; };
    const aP = (s) => { s.actionLoading = true; };
    const aF = (s) => { s.actionLoading = false; };
    const aR = (s, a) => { s.actionLoading = false; s.error = a.payload; };

    b
      // Categories
      .addCase(fetchCategories.pending, pend)
      .addCase(fetchCategories.fulfilled, (s, a) => { s.loading = false; s.categories = a.payload ?? []; })
      .addCase(fetchCategories.rejected, rej)
      .addCase(createCategory.fulfilled, (s, a) => { if (a.payload?.id) s.categories.unshift(a.payload); })
      .addCase(updateCategory.fulfilled, (s, a) => {
        if (a.payload?.id) { const i = s.categories.findIndex((c) => c.id === a.payload.id); if (i !== -1) s.categories[i] = a.payload; }
      })
      .addCase(deleteCategory.fulfilled, (s, a) => { s.categories = s.categories.filter((c) => c.id !== a.payload); })

      // Questions
      .addCase(fetchQuestions.pending, pend)
      .addCase(fetchQuestions.fulfilled, (s, a) => { s.loading = false; s.questions = a.payload ?? []; })
      .addCase(fetchQuestions.rejected, rej)
      .addCase(createQuestion.fulfilled, (s, a) => { if (a.payload?.id) s.questions.push(a.payload); })
      .addCase(updateQuestion.fulfilled, (s, a) => {
        if (a.payload?.id) { const i = s.questions.findIndex((q) => q.id === a.payload.id); if (i !== -1) s.questions[i] = a.payload; }
      })
      .addCase(deleteQuestion.fulfilled, (s, a) => { s.questions = s.questions.filter((q) => q.id !== a.payload); })

      // Forms
      .addCase(fetchForms.pending, pend)
      .addCase(fetchForms.fulfilled, (s, a) => { s.loading = false; s.forms = a.payload.forms ?? []; s.pagination = a.payload.pagination ?? {}; })
      .addCase(fetchForms.rejected, rej)
      .addCase(toggleFormActive.pending, aP).addCase(toggleFormActive.fulfilled, (s, a) => {
        aF(s);
        if (a.payload?.id) { const i = s.forms.findIndex((f) => f.id === a.payload.id); if (i !== -1) s.forms[i] = a.payload; }
      }).addCase(toggleFormActive.rejected, aR)
      .addCase(deleteForm.pending, aP).addCase(deleteForm.fulfilled, (s, a) => {
        aF(s); s.forms = s.forms.filter((f) => f.id !== a.payload);
      }).addCase(deleteForm.rejected, aR)
      .addCase(deleteFormResponses.pending, aP).addCase(deleteFormResponses.fulfilled, aF).addCase(deleteFormResponses.rejected, aR)
      .addCase(updateActionTaken.pending, aP).addCase(updateActionTaken.fulfilled, aF).addCase(updateActionTaken.rejected, aR)

      // Student
      .addCase(fetchMyForms.pending, (s) => { s.actionLoading = true; s.error = null; })
      .addCase(fetchMyForms.fulfilled, (s, a) => {
        s.actionLoading = false;
        // payload is the forms array directly
        s.myForms = Array.isArray(a.payload) ? a.payload : [];
      })
      .addCase(fetchMyForms.rejected, (s, a) => { s.actionLoading = false; s.error = a.payload; })
      .addCase(submitFeedback.pending, aP).addCase(submitFeedback.fulfilled, aF).addCase(submitFeedback.rejected, aR)

      // Results
      .addCase(fetchFormResults.pending, (s) => { s.actionLoading = true; })
      .addCase(fetchFormResults.fulfilled, (s, a) => { s.actionLoading = false; s.results = a.payload; })
      .addCase(fetchFormResults.rejected, (s) => { s.actionLoading = false; });
  },
});

export const { clearResults, clearError } = feedbackSlice.actions;
export default feedbackSlice.reducer;