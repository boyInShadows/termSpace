import { z } from "zod";
import { platformSchema } from "../lib/marketplaceCompatibility.js";

const reason = z.string().trim().min(10).max(1000);
const version = z.number().int().min(0);
export const communitySchema = z
  .object({
    nameEn: z.string().trim().min(2).max(100),
    nameFa: z.string().trim().max(100).nullable(),
    descriptionEn: reason,
    descriptionFa: z.string().trim().max(1000).nullable(),
    primaryPlatform: platformSchema,
    rulesEn: reason,
    rulesFa: z.string().trim().max(1000).nullable(),
    submissionGuidanceEn: reason,
    submissionGuidanceFa: z.string().trim().max(1000).nullable(),
    state: z.enum(["ACTIVE", "ARCHIVED"]),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();
export const placementDecisionSchema = z
  .object({
    expectedVersion: version,
    state: z.enum(["APPROVED", "REJECTED", "REMOVED"]),
    publicReason: reason,
    internalNote: z.string().trim().max(4000).optional(),
  })
  .strict();
export const collectionSchema = z
  .object({
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000),
    published: z.boolean(),
    productIds: z
      .array(z.string().min(1).max(100))
      .max(50)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Listings must be unique",
      ),
  })
  .strict();
export const reportSchema = z
  .object({
    targetType: z.enum([
      "PRODUCT",
      "RELEASE",
      "PLACEMENT",
      "CREATOR",
      "REVIEW",
      "RESPONSE",
    ]),
    targetId: z.string().min(1).max(100),
    reason: z.enum([
      "MALICIOUS",
      "SOURCE_COMPROMISE",
      "IMPERSONATION",
      "MISLEADING",
      "BROKEN",
      "ABUSE",
      "OTHER",
    ]),
    explanation: z.string().trim().min(10).max(4000),
  })
  .strict();
export const caseDecisionSchema = z
  .object({
    expectedVersion: version,
    action: z.enum(["TRIAGE", "INVESTIGATE", "DISMISS", "RESTRICT", "LIFT"]),
    severity: z.enum(["STANDARD", "HIGH", "CRITICAL"]),
    publicReason: reason,
    internalNote: z.string().trim().max(4000).optional(),
  })
  .strict();
export const appealSchema = z
  .object({
    decisionEventId: z.string().min(1).max(100),
    explanation: z.string().trim().min(10).max(4000),
    evidence: z.string().trim().min(10).max(4000),
  })
  .strict();
export const appealDecisionSchema = z
  .object({
    expectedVersion: version,
    outcome: z.enum(["UPHELD", "MODIFIED", "REVERSED"]),
    publicReason: reason,
    internalNote: z.string().trim().max(4000).optional(),
  })
  .strict();
export const accountCaseSchema = z
  .object({
    userId: z.string().min(1).max(100),
    publicReason: reason,
    internalNote: z.string().trim().max(4000).optional(),
  })
  .strict();
