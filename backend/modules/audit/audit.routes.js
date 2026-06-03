import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as c from "./audit.controller.js";

const router = Router();
const ADMIN = ["SUPER_ADMIN", "ADMIN"];

// Static routes first
router.get( "/stats",      authenticate, authorize(...ADMIN), c.getStats);
router.get( "/export",     authenticate, authorize("SUPER_ADMIN"), c.exportCsv);
router.post("/:id/restore",authenticate, authorize("SUPER_ADMIN"), c.restore);

router.get( "/",           authenticate, authorize(...ADMIN), c.getLogs);
router.get( "/:id",        authenticate, authorize(...ADMIN), c.getLog);

export default router;
