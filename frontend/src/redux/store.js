import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice.js";
import studentReducer from "./student/studentSlice.js";
import facultyReducer from "./faculty/facultySlice.js";
import adminReducer from "./admin/adminSlice.js";
import sharedReducer from "./slice.js";
import feedbackReducer from "./feedback/feedbackSlice.js";
import academicReducer from "./academic/academicSlice.js";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        student: studentReducer,
        faculty: facultyReducer,
        admin: adminReducer,
        feedbackNew: feedbackReducer,  // registered as feedbackNew — sharedReducer provides "feedback"
        academic: academicReducer,
        ...sharedReducer,              // provides: feedback, program, course, section, subject
    },
});