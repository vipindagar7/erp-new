import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

const logDir = "logs";

// Create logs directory automatically
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

/* =========================================================
   LOG FORMAT
========================================================= */

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }),

    winston.format.errors({
        stack: true,
    }),

    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message
            }`;
    })
);

/* =========================================================
   INFO LOG FILE
========================================================= */

const infoTransport = new DailyRotateFile({
    filename: path.join(logDir, "application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
});

/* =========================================================
   ERROR LOG FILE
========================================================= */

const errorTransport = new DailyRotateFile({
    filename: path.join(logDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    level: "error",
});

/* =========================================================
   LOGGER
========================================================= */

export const logger = winston.createLogger({
    level: "info",

    format: logFormat,

    transports: [
        infoTransport,
        errorTransport,

        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
        }),
    ],

    exceptionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, "exceptions.log"),
        }),
    ],

    rejectionHandlers: [
        new winston.transports.File({
            filename: path.join(logDir, "rejections.log"),
        }),
    ],
});