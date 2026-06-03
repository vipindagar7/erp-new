// backend/modules/notification/notification.service.js
import prisma from "../../utils/prisma.js";

export const listNotificationsService = async (userId, { page, limit, unread }) => {
  const skip  = (page - 1) * limit;
  const where = {
    user_id: userId,
    ...(unread === "true" && { is_read: false }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUnreadCountService = async (userId) => {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });
};

export const markReadService = async (userId, id) => {
  const notification = await prisma.notification.findFirst({
    where: { id, user_id: userId },
  });
  if (!notification) return null;

  return prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });
};

export const markAllReadService = async (userId) => {
  return prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
};

export const deleteNotificationService = async (userId, id) => {
  const notification = await prisma.notification.findFirst({
    where: { id, user_id: userId },
  });
  if (!notification) return null;

  await prisma.notification.delete({ where: { id } });
  return true;
};
