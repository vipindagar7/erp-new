import { LOG_LEVELS } from "./constants";

// INFO
// normal operations (fetch, create)
// WARN
// suspicious activity (multiple login attempts)
// ERROR
// failures (DB error, auth failure)
// DEBUG
// development logs

export const logResponse = ({
    level,
    message,
    meta = {},
}) => {
    const log = {
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
    };

    if (level === LOG_LEVELS.ERROR) {
        console.error(log);
    } else if (level === LOG_LEVELS.WARN) {
        console.warn(log);
    } else {
        console.log(log);
    }
};