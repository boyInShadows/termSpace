import { z } from "zod";

export const reviewSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(4000),
  expectedVersion: z.number().int().min(0).optional(),
}).strict();

export const reviewResponseSchema = z.object({ body: z.string().trim().min(10).max(2000) }).strict();

export const reviewDecisionSchema = z.object({
  action: z.enum(["APPROVE", "HOLD", "REMOVE"]),
  expectedVersion: z.number().int().min(0),
  publicReason: z.string().trim().min(10).max(1000),
  internalNote: z.string().trim().max(4000).optional(),
}).strict();
