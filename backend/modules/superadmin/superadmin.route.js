// backend/modules/superadmin/superadmin.routes.js
// ALL routes root-only — only is_root user can manage super admins
import { Router } from "express";
import { authenticate, rootOnly } from "../../middlewares/auth.middleware.js";
import { auditLog } from "../../middlewares/audit.middleware.js";
import * as c from "./superadmin.controller.js";

const router = Router();

// Static routes first
router.get( "/stats",              authenticate, rootOnly, c.getStats);
router.get( "/",                   authenticate, rootOnly, c.getAll);
router.post("/",                   authenticate, rootOnly, c.create);
router.get( "/:id",                authenticate, rootOnly, c.getOne);
router.patch("/:id",               authenticate, rootOnly, c.update);
router.get( "/:id/activity",       authenticate, rootOnly, c.getActivity);
router.post("/:id/block",          authenticate, rootOnly, c.block);
router.post("/:id/unblock",        authenticate, rootOnly, c.unblock);
router.post("/:id/demote",         authenticate, rootOnly, c.demote);
router.post("/:id/reset-password", authenticate, rootOnly, c.resetPwd);
router.delete("/:id",              authenticate, rootOnly, c.remove);

export default router;