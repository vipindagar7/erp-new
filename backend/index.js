import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import morgan from "morgan";
import xss from "xss-clean";

import { connectDB } from "./db/connectDB.js";
import { requestLogger } from "./middlewares/request.logger.js";
/* =========================================================
   ROUTES
========================================================= */

import authRoutes from "./modules/auth/auth.route.js";
import permissionsRouter from "./modules/permissions/permissions.routes.js";
import sessionRoutes from "./modules/session/session.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import roleUpgradeRoutes from "./modules/roleUpgrade/role.upgrade.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
import deptRoutes from "./modules/department/department.routes.js";
import programRoutes from "./modules/programs/program.routes.js";
import courseRoutes from "./modules/course/course.routes.js";
import subjectRoutes from "./modules/subject/subject.routes.js";
import sectionRoutes from "./modules/section/section.routes.js";
import feedbackRoutes from "./modules/feedback/feedback.routes.js";
import facultyRoutes from "./modules/faculty/faculty.routes.js";
import branchRoutes from "./modules/branch/branch.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import superAdminRoutes from "./modules/superadmin/superadmin.route.js";
import roleRouter from "./modules/role/role.routes.js";

import adminRoutes from "./modules/admin/admin.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";

import adminEnrollRoutes from "./modules/enrollment/enrollment.routes.js";
import studentEnrollRoutes from "./modules/student/student-enrollment.routes.js";
import curriculumRoutes from "./modules/curriculum/curriculum.routes.js";
import roomRoutes from "./modules/rooms/rooms.routes.js";
import timetableRoutes from "./modules/timetable/timetable.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import groupsRoutes from "./modules/groups/groups.routes.js";
import { logger } from "./utils/logger.js";

// imports (top of file with others)
import leaveRoutes from "./modules/leave/leave.routes.js";
import bulkRoutes from "./modules/bulk/bulk.routes.js";
import uiPermRoutes from "./modules/uiPermissions/ui.permission.routes.js";
import calendarRouter from "./modules/academic/calendar.routes.js";
import extraAttendRouter from "./modules/attendance/extra.routes.js";
import studentLeaveRouter from "./modules/leave/student.leave.routes.js";
import assignmentRouter from "./modules/assignment/assignment.routes.js";
import examRouter from "./modules/exam/exam.routes.js";
import feeRouter from "./modules/fee/fee.routes.js";
import salaryRouter from "./modules/hr/salary.routes.js";
import holidayRoutes from "./modules/holiday/holiday.routes.js";
import skillcardRouter from "./modules/skillcard/skillcard.routes.js";
import deptScopeRouter from "./modules/admin/deptscope.routes.js";
import facultyBulkRouter from "./modules/faculty/faculty.bulkops.routes.js";
import leaveRulesRouter from "./modules/hr/leave-rules.routes.js";
import salaryCalcRouter from "./modules/hr/salary-calculator.routes.js";

// Middleware
import { attachDeptScope } from "./middlewares/deptScope.middleware.js";

// Cron
import { startFreezeCron } from "./utils/freeze.cron.js";

// ── Register middleware (add after authenticate) ──────────


import otpRoutes from "./modules/otp/otp.routes.js";
import erpSettingsRoutes from "./modules/erpSettings/erp.settings.routes.js";
import customRolesRoutes from "./modules/customRoles/customRoles.route.js";
import { serveUploads } from "./utils/fileStorage.js";
import { seedDefaultSettings } from "./modules/erpSettings/erp.settings.service.js";

import rbacRoutes from "./modules/rbac/rbac.routes.js";
import { loadUserRoles } from "./modules/rbac/rbac.middleware.js";
import { initializeRoles } from "./modules/rbac/rbac.service.js";
/* =========================================================
   APP
========================================================= */

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================================
   TRUST PROXY
========================================================= */
// REQUIRED behind NGINX reverse proxy
app.set("trust proxy", 1);

/* =========================================================
   SECURITY HEADERS
========================================================= */

app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
    })
);

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
];

app.use(
    cors({
        origin(origin, callback) {

            // allow mobile apps / postman
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("CORS blocked"));
        },

        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
);

/* =========================================================
   RATE LIMITER
========================================================= */

// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 300,
//     message: {
//         success: false,
//         message: "Too many requests. Try again later.",
//     },
// });

// app.use(limiter);

/* =========================================================
   AUTH RATE LIMITER
========================================================= */

// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 10,
//     message: {
//         success: false,
//         message: "Too many login attempts.",
//     },
// });

// app.use("/api/auth", authLimiter);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
    express.json({
        limit: "10kb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10kb",
    })
);

/* =========================================================
   COOKIE PARSER
========================================================= */

app.use(cookieParser());

/* =========================================================
   DATA SANITIZATION
========================================================= */

// Prevent XSS
// app.use(xss());

// Prevent parameter pollution
app.use(hpp());

/* =========================================================
   COMPRESSION
========================================================= */

app.use(compression());
app.use(requestLogger);


/* =========================================================
   LOGGER
========================================================= */

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/health", (_req, res) => {
    return res.status(200).json({
        success: true,
        message: "ERP Backend Running 🚀",
    });
});

/* =========================================================
   ROUTES
========================================================= */
app.use(attachDeptScope);  // attach to all authenticated routes

app.use("/api/auth", authRoutes);

app.use("/api/sessions", sessionRoutes);

app.use("/api/role-upgrade", roleUpgradeRoutes);

app.use("/api/audit", auditRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/departments", deptRoutes);

app.use("/api/programs", programRoutes);

app.use("/api/courses", courseRoutes);

app.use("/api/subjects", subjectRoutes);
app.use("/api/holidays", holidayRoutes);

app.use("/api/sections", sectionRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/roles", roleRouter);
app.use("/api/groups", groupsRoutes);
app.use("/api/bulk", bulkRoutes);
app.use("/api/ui-permissions", uiPermRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/calendar", calendarRouter);
app.use("/api/attendance/extra", extraAttendRouter);
app.use("/api/student-leave", studentLeaveRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/permissions", permissionsRouter);
app.use("/api/exam", examRouter);
app.use("/api/fee", feeRouter);
app.use("/api/hr", salaryRouter);
app.use("/api/skill-card", skillcardRouter);
app.use("/api/admin/dept-scope", deptScopeRouter);
app.use("/api/faculty/bulk", facultyBulkRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/admin/enrollments", adminEnrollRoutes);
app.use("/api/students/enrollments", studentEnrollRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/branches", branchRoutes);
app.use("/uploads", serveUploads());
app.use("/api/otp", otpRoutes);
app.use("/api/settings", erpSettingsRoutes);
app.use("/api/access-roles", customRolesRoutes);
app.use("/api/hr/leave", leaveRulesRouter);
app.use("/api/hr/salary", salaryCalcRouter);

// ── Start cron ────────────────────────────────────────────
startFreezeCron();

/* =========================================================
   404 HANDLER
========================================================= */

app.use((err, req, res, _next) => {

    const status = err.status || err.statusCode || 500;

    logger.error(
        `${req.method} ${req.originalUrl} - ${err.message}`
    );

    return res.status(status).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Internal server error"
                : err.message,
    });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, _next) => {

    const status = err.status || err.statusCode || 500;

    const message =
        process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message;

    if (status >= 500) {
        console.error(
            `[${status}] ${req.method} ${req.path}`,
            err
        );
    }

    return res.status(status).json({
        success: false,
        message,
    });
});


// rbac
app.use("/api/rbac", rbacRoutes);
app.use(loadUserRoles);  // ← add this AFTER cookie-parser/auth setup
initializeRoles().catch(console.error);



/* =========================================================
   SERVER START
========================================================= */

const startServer = async () => {
    try {

        await connectDB();
        await seedDefaultSettings(); // idempotent — safe to run on every boot

        app.listen(PORT, () => {
            logger.info(`🚀 ERP Backend running on port ${PORT}`);

        });

    } catch (error) {

        logger.error(`Database connection failed: ${error.message}`);
        console.log(error)
        process.exit(1);
    }
};

startServer();

/* =========================================================
   PROCESS HANDLERS
========================================================= */

process.on("uncaughtException", (err) => {

    console.error("UNCAUGHT EXCEPTION:", err);

    process.exit(1);
});

process.on("unhandledRejection", (err) => {

    console.error("UNHANDLED REJECTION:", err);

    process.exit(1);
});