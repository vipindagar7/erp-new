// backend/modules/leave/leave.validator.js
import { z } from "zod";

export const createLeaveTypeSchema = z.object({
  code:               z.string().min(1).max(10).toUpperCase(),
  name:               z.string().min(1),
  applicable_to:      z.array(z.enum(["TEACHING","NON_TEACHING","ALL"])).default(["ALL"]),
  max_days_per_year:  z.coerce.number().int().min(0).default(0),
  carry_forward:      z.boolean().default(false),
  carry_forward_max:  z.coerce.number().int().optional().nullable(),
  is_paid:            z.boolean().default(true),
  requires_document:  z.boolean().default(false),
  min_days:           z.coerce.number().min(0.5).default(0.5),
  max_consecutive:    z.coerce.number().int().optional().nullable(),
  notice_days:        z.coerce.number().int().default(0),
  description:        z.string().optional().nullable(),
});

export const createPolicySchema = z.object({
  name:           z.string().min(1),
  contract_types: z.array(z.string()).default([]),
  employee_types: z.array(z.string()).default([]),
  sat_off_rule:   z.enum(["ALL","FIRST_THIRD","SECOND_FOURTH","NONE"]).default("NONE"),
  terms_text:     z.string().optional().nullable(),
  rules: z.array(z.object({
    leave_type_id:  z.string().uuid(),
    days_per_year:  z.coerce.number().int().min(0),
    carry_forward:  z.boolean().default(false),
    carry_forward_max: z.coerce.number().int().optional().nullable(),
  })).default([]),
});

export const leaveApplicationSchema = z.object({
  leave_type_id:  z.string().uuid(),
  from_date:      z.string().min(1),
  to_date:        z.string().min(1),
  reason:         z.string().min(1),
  half_day:       z.boolean().default(false),
  half_day_period:z.enum(["MORNING","AFTERNOON"]).optional().nullable(),
  policy_accepted:z.boolean().default(false),
  policy_version: z.coerce.number().int().optional().nullable(),
  documents:      z.array(z.string()).default([]),
  substitutions:  z.array(z.object({
    date:          z.string(),
    period_name:   z.string(),
    subject_name:  z.string().optional(),
    substitute_id: z.string().uuid(),
    entry_id:      z.string().uuid().optional().nullable(),
  })).default([]),
});

export const approveLeaveSchema = z.object({
  action:  z.enum(["APPROVE","REJECT"]),
  remarks: z.string().optional().nullable(),
});

export const studentLeaveSchema = z.object({
  from_date: z.string().min(1),
  to_date:   z.string().min(1),
  reason:    z.string().min(1),
  documents: z.array(z.string()).default([]),
});

export const approveStudentLeaveSchema = z.object({
  action:  z.enum(["APPROVE","REJECT"]),
  remarks: z.string().optional().nullable(),
});

export const workflowSchema = z.object({
  faculty_id: z.string().uuid(),
  steps: z.array(z.object({
    level:       z.coerce.number().int().min(1),
    approver_id: z.string().uuid(),
    approver_role: z.string().optional(),
  })).min(1),
});