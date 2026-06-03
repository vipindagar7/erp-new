import { logResponse } from "./logger";
import { LOG_LEVELS } from "./constants";

// function to send success response
export const sendSuccess = (
    res,
    {
        message = "Success",
        data = null,
        statusCode = 200,
        meta = {},
        logLevel = LOG_LEVELS.INFO,
    }
) => {
    logResponse({
        level: logLevel,
        message,
        meta: {
            statusCode,
            dataPreview: data ? "exists" : null,
            ...meta,
        },
    });

    return res.status(statusCode).json({
        success: true,
        message,
        data,
        meta,
    });
};



// function to send error response
export const sendError = (
    res,
    {
        message = "Something went wrong",
        statusCode = 500,
        error = null,
        logLevel = LOG_LEVELS.ERROR,
    }
) => {
    logResponse({
        level: logLevel,
        message,
        meta: {
            statusCode,
            error,
        },
    });

    return res.status(statusCode).json({
        success: false,
        message,
        error,
    });
};



/*
import { sendSuccess, sendError } from "@/shared/responses/responseHandler";

export const getStudents = async (req, res) => {
  try {
    const students = await studentService.getAll();

    return sendSuccess(res, {
      message: "Students fetched",
      data: students,
    });
  } catch (err) {
    return sendError(res, {
      message: "Failed to fetch students",
      error: err.message,
    });
  }
};
*/