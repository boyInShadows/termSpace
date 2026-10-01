import { z } from "zod";

export const maintenanceSchema = z.object({
  status: z.enum(["ACTIVE", "DEPRECATED", "ABANDONED"]),
  note: z.string().trim().max(1000).nullable(),
}).strict().refine(({ status, note }) => status === "ACTIVE" || Boolean(note && note.length >= 10), { path: ["note"], message: "Explain why this listing is deprecated or abandoned" });

export const curatedCollectionSchema = z.object({
  titleEn: z.string().trim().min(2).max(100),
  titleFa: z.string().trim().max(100).nullable(),
  descriptionEn: z.string().trim().min(10).max(1000),
  descriptionFa: z.string().trim().max(1000).nullable(),
  scope: z.enum(["STAFF", "COMMUNITY"]),
  communitySlug: z.string().trim().min(1).max(80).nullable(),
  published: z.boolean(),
  position: z.number().int().min(0).max(1000),
  productIds: z.array(z.string().min(1).max(100)).max(50).refine((ids) => new Set(ids).size === ids.length, "Listings must be unique"),
}).strict().refine(({ scope, communitySlug }) => scope === "COMMUNITY" ? Boolean(communitySlug) : !communitySlug, { path: ["communitySlug"], message: "Community collections require a community" });

export const curatedOptionsQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  ids: z.string().max(5000).default("").refine((value) => value.split(",").filter(Boolean).length <= 50, "Too many selected listings"),
}).strict();
