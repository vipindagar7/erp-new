// backend/modules/academicSession/session.routes.js
import { Router } from "express";
import multer    from "multer";
import { authenticate, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./session.controller.js";
import { createSessionSchema, updateSessionSchema, createPeriodSchema, updatePeriodSchema } from "./session.validator.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Static ─────────────────────────────────────────────────────
router.get( "/current",             authenticate,               c.getCurrent);
router.get( "/",                    authenticate, superAdminOnly, validate(createSessionSchema.pick({}).partial(), "query"), c.getAll);
router.post("/",                    authenticate, superAdminOnly, validate(createSessionSchema), c.create);

// ── /:id ──────────────────────────────────────────────────────
router.get(   "/:id",              authenticate, superAdminOnly, c.getOne);
router.patch( "/:id",              authenticate, superAdminOnly, validate(updateSessionSchema), c.update);
router.patch( "/:id/set-current",  authenticate, superAdminOnly, c.setCurrent);
router.patch( "/:id/lock",         authenticate, superAdminOnly, c.toggleLock);
router.get(   "/:id/summary",      authenticate, superAdminOnly, c.getSummary);
router.get(   "/:id/current-period",authenticate,               c.getPeriod);

// ── Calendar periods ──────────────────────────────────────────
router.get(   "/:id/periods",               authenticate,               c.listPeriods);
router.post(  "/:id/periods",               authenticate, superAdminOnly, validate(createPeriodSchema), c.addPeriod);
router.patch( "/:id/periods/:pid",          authenticate, superAdminOnly, validate(updatePeriodSchema), c.editPeriod);
router.delete("/:id/periods/:pid",          authenticate, superAdminOnly, c.removePeriod);
router.get(   "/:id/calendar-summary",      authenticate,               c.calSummary);
router.get(   "/:id/calendar-template",     authenticate,               c.calTemplate);
router.post(  "/:id/calendar-upload",       authenticate, superAdminOnly, upload.single("file"), c.calUpload);

export default router;
