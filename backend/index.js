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

import adminRoutes from "./modules/admin/admin.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";

import adminEnrollRoutes from "./modules/enrollment/enrollment.routes.js";
import studentEnrollRoutes from "./modules/student/student-enrollment.routes.js";
import curriculumRoutes from "./modules/curriculum/curriculum.routes.js";

import settingsRoutes from "./modules/settings/settings.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import groupsRoutes from "./modules/groups/groups.routes.js";
import { logger } from "./utils/logger.js";

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

app.use("/api/auth", authRoutes);

app.use("/api/role-upgrade", roleUpgradeRoutes);

app.use("/api/audit", auditRoutes);

app.use("/api/students", studentRoutes);

app.use("/api/departments", deptRoutes);

app.use("/api/programs", programRoutes);

app.use("/api/courses", courseRoutes);

app.use("/api/subjects", subjectRoutes);

app.use("/api/sections", sectionRoutes);

app.use("/api/feedback", feedbackRoutes);

app.use("/api/faculty", facultyRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/reports", reportsRoutes);

app.use("/api/admin/enrollments", adminEnrollRoutes);

app.use("/api/students/enrollments", studentEnrollRoutes);

app.use("/api/groups", groupsRoutes);

app.use("/api/curriculum", curriculumRoutes);


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

/* =========================================================
   SERVER START
========================================================= */

const startServer = async () => {
    try {

        await connectDB();

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