// backend/modules/branch/branch.validator.js
import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string({ required_error: "Branch name is required" })
    .min(2, "At least 2 characters").max(100).trim(),
  dept_id: z.string().uuid().optional(),
  code: z.string().max(20).trim().toUpperCase().optional().nullable(),
  has_combined_first_year: z.boolean().optional().default(false),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  dept_id: z.string().uuid().optional(),
  code: z.string().max(20).trim().toUpperCase().optional().nullable(),
  has_combined_first_year: z.boolean().optional(),
});

export const branchListSchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || "1")),
  limit: z.string().optional().transform((v) => parseInt(v || "20")),
  search: z.string().trim().optional(),
  dept_id: z.string().uuid().optional(),
  include_deleted: z.string().optional().transform((v) => v === "true"),
});
