// backend/modules/session/session.routes.js
import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import * as c from "./session.controller.js";

const router = Router();

router.get("/current", authenticate, requirePerm("session:view"), c.getCurrent);
router.get("/", authenticate, requirePerm("session:view"), c.list);
router.post("/", authenticate, requirePerm("session:create"), auditLog("session", "CREATE"), c.create);
router.get("/:id", authenticate, requirePerm("session:view"), c.getById);
router.patch("/:id", authenticate, requirePerm("session:update"), auditLog("session", "UPDATE"), c.update);
router.patch("/:id/set-current", authenticate, requirePerm("session:set_current"), auditLog("session", "SET_CURRENT"), c.setCurrent);
router.patch("/:id/lock", authenticate, requirePerm("session:lock"), auditLog("session", "LOCK"), c.toggleLock);
router.get("/:id/summary", authenticate, requirePerm("session:view"), c.getSummary);

export default router;