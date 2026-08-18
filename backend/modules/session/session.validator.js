// backend/modules/academicSession/session.validator.js
import { z } from "zod";

const PERIOD_TYPES = ["ACADEMIC","EXAM","HOLIDAY","BREAK","EVENT","OTHER"];

export const createSessionSchema = z.object({
  name:       z.string().min(1, "Session name required"),
  code:       z.string().optional(),
  label:      z.string().optional(),
  start_date: z.string().or(z.date()),
  end_date:   z.string().or(z.date()),
  notes:      z.string().optional().nullable(),
  periods:    z.array(z.object({
    type:       z.enum(PERIOD_TYPES).default("ACADEMIC"),
    label:      z.string().min(1),
    start_date: z.string(),
    end_date:   z.string(),
    notes:      z.string().optional().nullable(),
    order:      z.coerce.number().int().optional(),
  })).optional().default([]),
});

export const updateSessionSchema = createSessionSchema.partial();

export const createPeriodSchema = z.object({
  type:       z.enum(PERIOD_TYPES).default("ACADEMIC"),
  label:      z.string().min(1, "Label required"),
  start_date: z.string().min(1, "Start date required"),
  end_date:   z.string().min(1, "End date required"),
  notes:      z.string().optional().nullable(),
  order:      z.coerce.number().int().optional(),
});

export const updatePeriodSchema = createPeriodSchema.partial();
