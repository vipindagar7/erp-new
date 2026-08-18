// backend/modules/customRoles/customRoles.routes.js
import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as ctrl from "./customRoles.controller.js";

const router = Router();

router.get("/permissions", authenticate, requirePerm("roles.view"), ctrl.listPermissions);
router.get("/", authenticate, requirePerm("roles.view"), ctrl.list);
router.post("/", authenticate, requirePerm("roles.create"), ctrl.create);
router.get("/:id", authenticate, requirePerm("roles.view"), ctrl.getById);
router.patch("/:id", authenticate, requirePerm("roles.update"), ctrl.update);
router.delete("/:id", authenticate, requirePerm("roles.delete"), ctrl.remove);
router.get("/:id/users", authenticate, requirePerm("roles.view"), ctrl.usersWithRole);
router.post("/:id/assign", authenticate, requirePerm("roles.assign"), ctrl.assign);
router.post("/:id/revoke", authenticate, requirePerm("roles.assign"), ctrl.revoke);

export default router;