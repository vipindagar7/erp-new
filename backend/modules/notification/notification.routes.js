// backend/modules/notification/notification.routes.js
import express from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
} from "./notification.controller.js";
import { validate, listQuerySchema, idParamSchema } from "./notification.validator.js";

const router = express.Router();
router.use(authenticate);

router.get(  "/",               validate(listQuerySchema, "query"), getMyNotifications);
router.get(  "/unread-count",                                       getUnreadCount);
router.patch("/read-all",                                           markAllRead);
router.patch("/:id/read",       validate(idParamSchema, "params"),  markRead);
router.delete("/:id",           validate(idParamSchema, "params"),  deleteNotification);

export default router;
