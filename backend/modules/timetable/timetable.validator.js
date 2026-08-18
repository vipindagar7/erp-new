// backend/modules/timetable/timetable.validator.js
import { z } from "zod";

const DAYS        = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const PERIOD_TYPES= ["LECTURE","LAB","LUNCH","BREAK","ASSEMBLY","OTHER"];
const ENTRY_TYPES = ["LECTURE","LAB","TUTORIAL","FREE","LUNCH","BREAK"];
const TT_STATUS   = ["DRAFT","PUBLISHED","LOCKED","ARCHIVED"];

// ── Period Config ─────────────────────────────────────────────
export const createPeriodSchema = z.object({
  name:       z.string().min(1, "Period name required"),
  type:       z.enum(PERIOD_TYPES).default("LECTURE"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  order:      z.coerce.number().int().min(0).default(0),
  days:       z.array(z.enum(DAYS)).default(["MON","TUE","WED","THU","FRI"]),
});

export const bulkPeriodSchema = z.object({
  configs:  z.array(createPeriodSchema).min(1, "At least one period required"),
  replace:  z.boolean().default(false),
});

// ── Workload ──────────────────────────────────────────────────
export const workloadUploadSchema = z.object({
  session_id: z.string().uuid("Valid session_id required"),
});

// ── Auto-generate ─────────────────────────────────────────────
export const generateSchema = z.object({
  session_id:       z.string().uuid("session_id required"),
  dept_id:          z.string().uuid().optional(),
  replace_existing: z.boolean().default(false),
  only_draft:       z.boolean().default(true),
});

// ── Timetable entry ───────────────────────────────────────────
export const upsertEntrySchema = z.object({
  day:                 z.enum(DAYS),
  period_config_id:    z.string().uuid("Valid period_config_id required"),
  subject_id:          z.string().uuid().optional().nullable(),
  faculty_id:          z.string().uuid().optional().nullable(),
  room_id:             z.string().uuid().optional().nullable(),
  entry_type:          z.enum(ENTRY_TYPES).default("LECTURE"),
  notes:               z.string().optional().nullable(),
  is_combined:         z.boolean().default(false),
  combined_section_id: z.string().uuid().optional().nullable(),
});

// ── Clash check ───────────────────────────────────────────────
export const clashCheckSchema = z.object({
  timetable_id:     z.string().uuid(),
  day:              z.enum(DAYS),
  period_config_id: z.string().uuid(),
  faculty_id:       z.string().uuid().optional(),
  room_id:          z.string().uuid().optional(),
  exclude_entry_id: z.string().uuid().optional(),
});

// ── List ──────────────────────────────────────────────────────
export const timetableListSchema = z.object({
  session_id: z.string().uuid().optional(),
  dept_id:    z.string().uuid().optional(),
  status:     z.enum(TT_STATUS).optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(200).default(50),
});

export const globalViewSchema = z.object({
  session_id: z.string().uuid().optional(),
  dept_id:    z.string().uuid().optional(),
  day:        z.enum(DAYS).optional(),
});
