// backend/modules/rooms/rooms.validator.js
import { z } from "zod";

const ROOM_TYPES   = ["CLASSROOM","LAB","SEMINAR_HALL","AUDITORIUM","TRAINING_ROOM","CONFERENCE_ROOM","LIBRARY","OTHER"];
const STAFF_ROLES  = ["LAB_STAFF","IT_PERSON","INCHARGE","MAINTENANCE"];

export const createRoomSchema = z.object({
  name:        z.string().min(1, "Room name required"),
  code:        z.string().min(1, "Room code required"),
  type:        z.enum(ROOM_TYPES).default("CLASSROOM"),
  capacity:    z.coerce.number().int().min(1).max(10000).default(60),
  block:       z.string().optional().nullable(),
  floor:       z.string().optional().nullable(),
  dept_id:     z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  is_active:   z.boolean().default(true),
  subject_ids: z.array(z.string().uuid()).optional().default([]),
  staff_ids:   z.array(z.object({
    user_id: z.string().uuid(),
    role:    z.enum(STAFF_ROLES).default("LAB_STAFF"),
  })).optional().default([]),
});

export const updateRoomSchema = createRoomSchema.partial();

export const roomListSchema = z.object({
  search:    z.string().optional(),
  type:      z.enum(ROOM_TYPES).optional(),
  dept_id:   z.string().uuid().optional(),
  block:     z.string().optional(),
  floor:     z.string().optional(),
  is_active: z.enum(["true","false"]).optional(),
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(500).default(50),
});

export const addStaffSchema = z.object({
  user_id: z.string().uuid("Valid user_id required"),
  role:    z.enum(STAFF_ROLES).default("LAB_STAFF"),
});

export const availabilitySchema = z.object({
  day:              z.string().min(2),
  period_config_id: z.string().uuid(),
  exclude_entry_id: z.string().uuid().optional(),
});
