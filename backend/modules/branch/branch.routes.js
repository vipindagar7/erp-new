// backend/modules/branch/branch.routes.js
import { Router } from "express";
import multer from "multer";
import { authenticate, requirePerm, superAdminOnly, rootOnly } from "../../middlewares/auth.middleware.js";
import * as c from "./branch.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/stats", authenticate, requirePerm("academic.view"), c.getStats);
router.get("/template", authenticate, requirePerm("academic.view"), c.getTemplate);
router.post("/bulk-upload", authenticate, requirePerm("academic.create"), upload.single("file"), c.bulkUpload);

router.get("/", authenticate, requirePerm("academic.view"), c.getAll);
router.post("/", authenticate, requirePerm("academic.create"), c.create);
router.get("/:id", authenticate, requirePerm("academic.view"), c.getOne);
router.patch("/:id", authenticate, requirePerm("academic.update"), c.update);
router.delete("/:id", authenticate, superAdminOnly, c.remove);

router.post("/:id/restore", authenticate, superAdminOnly, c.restore);
router.post("/:id/discontinue", authenticate, superAdminOnly, c.discontinue);
router.post("/:id/reactivate", authenticate, superAdminOnly, c.reactivate);

router.get("/:id/history", authenticate, requirePerm("academic.view"), c.getHistory);
router.post("/:id/rollback/:history_id", authenticate, rootOnly, c.rollback);

export default router;