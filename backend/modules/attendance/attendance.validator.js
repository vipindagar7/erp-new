// backend/modules/attendance/attendance.validator.js
import { z } from "zod";

const STATUSES = ["PRESENT","ABSENT","LATE","EXCUSED","ON_LEAVE"];

export const markAttendanceSchema = z.object({
  session_id:       z.string().uuid(),
  section_id:       z.string().uuid(),
  subject_id:       z.string().uuid(),
  date:             z.string().min(1),
  period_name:      z.string().min(1),
  period_config_id: z.string().uuid().optional().nullable(),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status:     z.enum(STATUSES).default("PRESENT"),
    is_late:    z.boolean().default(false),
    late_reason:z.string().optional().nullable(),
  })).min(1),
});

export const updateSingleSchema = z.object({
  status:      z.enum(STATUSES),
  is_late:     z.boolean().optional(),
  late_reason: z.string().optional().nullable(),
  back_entry:  z.boolean().optional(),
  back_entry_reason: z.string().optional().nullable(),
});

export const backEntrySchema = z.object({
  session_id:  z.string().uuid(),
  section_id:  z.string().uuid(),
  subject_id:  z.string().uuid(),
  date:        z.string().min(1),
  period_name: z.string().min(1),
  reason:      z.string().min(1),
  records: z.array(z.object({
    student_id: z.string().uuid(),
    status:     z.enum(STATUSES).default("PRESENT"),
  })).min(1),
});

export const freezeSchema = z.object({
  session_id:    z.string().uuid(),
  scope:         z.enum(["INSTITUTE","DEPT","SECTION"]).default("INSTITUTE"),
  scope_id:      z.string().uuid().optional().nullable(),
  freeze_reason: z.string().optional().nullable(),
});

export const biometricUploadSchema = z.object({
  format: z.enum(["AUTO","OPTION_A","OPTION_B"]).default("AUTO"),
});

export const attendanceQuerySchema = z.object({
  session_id:  z.string().uuid().optional(),
  section_id:  z.string().uuid().optional(),
  subject_id:  z.string().uuid().optional(),
  student_id:  z.string().uuid().optional(),
  from_date:   z.string().optional(),
  to_date:     z.string().optional(),
  date:        z.string().optional(),
  period_name: z.string().optional(),
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(500).default(100),
});
