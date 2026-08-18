// backend/middlewares/audit.middleware.js
// Re-exports from audit.service.js for backward compatibility
// All audit logic is consolidated in audit.service.js
export {
  auditLog,
  requestAuditLogger,
  bulkAuditLog,
  logAuthEvent,
  logPermissionDenied,
  logSearchEvent,
  logExportEvent,
  createAuditLog,
} from "../modules/audit/audit.service.js";