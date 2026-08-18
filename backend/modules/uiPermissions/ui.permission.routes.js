// backend/modules/uiPermissions/ui.permission.routes.js
import { Router } from "express";
import { authenticate, rootOnly } from "../../middlewares/auth.middleware.js";
import { uiPermController as c } from "./ui.permission.service.js";

const router = Router();

// Anyone authenticated can read the map for their own role
router.get("/map",             authenticate, c.getMap);
router.get("/module/:module",  authenticate, c.getModule);

// Only root can write
router.get("/",                authenticate, rootOnly, c.getAll);
router.post("/set",            authenticate, rootOnly, c.set);
router.post("/bulk",           authenticate, rootOnly, c.bulkSet);
router.post("/reset",          authenticate, rootOnly, c.reset);
router.delete("/module/:module",authenticate, rootOnly, c.resetAll);

export default router;
