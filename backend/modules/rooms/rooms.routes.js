// backend/modules/rooms/rooms.routes.js
import { Router } from "express";
import multer    from "multer";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { validate } from "../../utils/validate.js";
import * as c from "./rooms.controller.js";
import { createRoomSchema, updateRoomSchema, roomListSchema, addStaffSchema, availabilitySchema } from "./rooms.validator.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Static (before /:id) ──────────────────────────────────────
router.get( "/template",    authenticate, c.getTemplate);
router.post("/bulk-upload", authenticate, requirePerm("academic:create"), upload.single("file"), c.bulkUpload);
router.get( "/stats",       authenticate, c.getStats);

// ── CRUD ──────────────────────────────────────────────────────
router.get( "/",    authenticate, validate(roomListSchema, "query"), c.getAll);
router.post("/",    authenticate, requirePerm("academic:create"), validate(createRoomSchema), c.create);
router.get( "/:id", authenticate, c.getOne);
router.patch("/:id",authenticate, requirePerm("academic:update"), validate(updateRoomSchema), c.update);
router.delete("/:id",authenticate, superAdminOnly, c.remove);
router.post( "/:id/restore", authenticate, superAdminOnly, c.restore);

// ── Subjects ──────────────────────────────────────────────────
router.post(  "/:id/subjects/:subject_id", authenticate, requirePerm("academic:update"), c.addSubject);
router.delete("/:id/subjects/:subject_id", authenticate, requirePerm("academic:update"), c.removeSubject);

// ── Staff ─────────────────────────────────────────────────────
router.post(  "/:id/staff",          authenticate, requirePerm("academic:update"), validate(addStaffSchema), c.addStaff);
router.delete("/:id/staff/:user_id", authenticate, requirePerm("academic:update"), c.removeStaff);

// ── Availability ──────────────────────────────────────────────
router.get("/:id/availability", authenticate, validate(availabilitySchema, "query"), c.checkAvailability);

export default router;
