// backend/modules/notification/notification.controller.js
import {
  listNotificationsService,
  getUnreadCountService,
  markReadService,
  markAllReadService,
  deleteNotificationService,
} from "./notification.service.js";

export const getMyNotifications = async (req, res) => {
  try {
    const { page, limit, unread } = req.validated ?? req.query;
    const data = await listNotificationsService(req.user.id, { page, limit, unread });
    res.json(data);
  } catch (error) {
    console.error("[Notification] getMyNotifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadCountService(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error("[Notification] getUnreadCount:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

export const markRead = async (req, res) => {
  try {
    const id = req.validated?.id ?? req.params.id;
    const updated = await markReadService(req.user.id, id);
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  } catch (error) {
    console.error("[Notification] markRead:", error);
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await markAllReadService(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("[Notification] markAllRead:", error);
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const id = req.validated?.id ?? req.params.id;
    const result = await deleteNotificationService(req.user.id, id);
    if (!result) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    console.error("[Notification] deleteNotification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};