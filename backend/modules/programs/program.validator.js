// backend/modules/programs/program.validator.js
import { z } from "zod";

export const createProgramSchema = z.object({
  name:           z.string({ required_error: "Program name is required" }).min(2).max(150).trim(),
  dept_id:        z.string({ required_error: "Department is required" }).uuid(),
  branch_id:      z.string().uuid().optional().nullable(),
  code:           z.string().max(15).trim().optional().nullable(),
  max_semesters:  z.union([z.number(), z.string()]).optional().nullable(),
  duration_years: z.union([z.number(), z.string()]).optional().nullable(),
});

export const updateProgramSchema = z.object({
  name:           z.string().min(2).max(150).trim().optional(),
  dept_id:        z.string().uuid().optional(),
  branch_id:      z.string().uuid().optional().nullable(),
  code:           z.string().max(15).trim().optional().nullable(),
  max_semesters:  z.union([z.number(), z.string()]).optional().nullable(),
  duration_years: z.union([z.number(), z.string()]).optional().nullable(),
});

export const programListSchema = z.object({
  page:      z.string().optional().transform((v) => parseInt(v || "1")),
  limit:     z.string().optional().transform((v) => parseInt(v || "20")),
  search:    z.string().trim().optional(),
  dept_id:   z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  status:    z.enum(["active", "inactive"]).optional(),
});