import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

/**
 * Community publishing: endpoints a signed-in reader uses to manage their own
 * creator profile and listings. Everything here is scoped to
 * `res.locals.reader`, set by `requireReader` — a member can only ever read or
 * mutate rows their own account owns.
 *
 * Editorial listings seeded by the team have `creator.userId = null`, so they
 * can never be matched by these queries.
 */

const OWNED_PRODUCT_FIELDS = {
  id: true, slug: true, name: true, type: true, outcome: true, description: true,
  tags: true, platforms: true, models: true, version: true, published: true,
  rating: true, reviewCount: true, usageCount: true, purchaseCount: true,
  verified: true, featured: true, createdAt: true, updatedAt: true,
  category: { select: { name: true, slug: true } },
} as const;

type OwnedProduct = Prisma.MarketplaceProductGetPayload<{
  select: typeof OWNED_PRODUCT_FIELDS;
}>;

function serializeOwnedProduct(product: OwnedProduct) {
  const { category, rating, ...rest } = product;
  return { ...rest, rating: Number(rating), category: category.name };
}

/** Derives display initials the same way the seeded creators present them. */
function initialsFrom(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.slice(0, 2);
  return letters.toUpperCase();
}

function readerId(res: Response): string {
  return res.locals.reader.id as string;
}

async function findOwnedCreator(res: Response) {
  return prisma.marketplaceCreator.findUnique({ where: { userId: readerId(res) } });
}

function creatorPayload(creator: { id: string; name: string; handle: string; initials: string; verified: boolean; bio: string; followers: number }) {
  return {
    id: creator.id, name: creator.name, handle: creator.handle,
    initials: creator.initials, verified: creator.verified,
    bio: creator.bio, followers: creator.followers,
  };
}

/* --- creator profile ----------------------------------------------------- */

export async function getMyCreatorProfile(_req: Request, res: Response) {
  const creator = await findOwnedCreator(res);
  res.json({ data: creator ? creatorPayload(creator) : null });
}

export async function createMyCreatorProfile(req: Request, res: Response) {
  const existing = await findOwnedCreator(res);
  if (existing) {
    res.status(409).json({ error: { code: "PROFILE_EXISTS", message: "This account already has a creator profile" } });
    return;
  }
  const { name, handle, bio } = req.body as { name: string; handle: string; bio: string };
  try {
    const creator = await prisma.marketplaceCreator.create({
      data: { name, handle, bio, initials: initialsFrom(name), userId: readerId(res), verified: false },
    });
    res.status(201).json({ data: creatorPayload(creator) });
  } catch (error) {
    // The handle is globally unique across seeded and community creators.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: { code: "HANDLE_TAKEN", message: "That username is already taken" } });
      return;
    }
    throw error;
  }
}

export async function updateMyCreatorProfile(req: Request, res: Response) {
  const creator = await findOwnedCreator(res);
  if (!creator) {
    res.status(404).json({ error: { code: "NO_PROFILE", message: "Create a creator profile first" } });
    return;
  }
  const { name, bio } = req.body as { name?: string; bio?: string };
  const updated = await prisma.marketplaceCreator.update({
    where: { id: creator.id },
    data: { ...(name ? { name, initials: initialsFrom(name) } : {}), ...(bio ? { bio } : {}) },
  });
  res.json({ data: creatorPayload(updated) });
}

/* --- listings ------------------------------------------------------------ */

export async function listMyProducts(_req: Request, res: Response) {
  const creator = await findOwnedCreator(res);
  if (!creator) { res.json({ data: [] }); return; }
  const products = await prisma.marketplaceProduct.findMany({
    where: { creatorId: creator.id },
    select: OWNED_PRODUCT_FIELDS,
    orderBy: { updatedAt: "desc" },
  });
  res.json({ data: products.map(serializeOwnedProduct) });
}

export async function createMyProduct(req: Request, res: Response) {
  const creator = await findOwnedCreator(res);
  if (!creator) {
    res.status(404).json({ error: { code: "NO_PROFILE", message: "Create a creator profile before publishing" } });
    return;
  }
  const body = req.body as {
    name: string; slug: string; type: string; category: string; outcome: string;
    description: string; platforms: string[]; models: string[]; tags: string[]; version: string;
  };

  const category = await prisma.marketplaceCategory.findFirst({ where: { name: body.category } });
  if (!category) {
    res.status(400).json({ error: { code: "UNKNOWN_CATEGORY", message: "Choose one of the listed categories" } });
    return;
  }

  try {
    const created = await prisma.marketplaceProduct.create({
      data: {
        slug: body.slug, name: body.name, type: body.type, outcome: body.outcome,
        description: body.description, platforms: body.platforms, models: body.models,
        tags: body.tags, version: body.version,
        creatorId: creator.id, categoryId: category.id,
        // Community submissions are free: no payment provider is configured.
        priceMinor: 0, currency: "USD", pricingModel: "free",
        // Trust and placement are editorial decisions, never client input.
        published: true, verified: false, featured: false, trending: false,
        rating: 0, reviewCount: 0, usageCount: 0, purchaseCount: 0,
        benefits: [], installationSteps: [], previewFiles: [],
      },
      select: OWNED_PRODUCT_FIELDS,
    });
    res.status(201).json({ data: serializeOwnedProduct(created) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ error: { code: "SLUG_TAKEN", message: "A listing with that URL already exists" } });
      return;
    }
    throw error;
  }
}

/** Loads a listing only when the signed-in member owns it. */
async function findOwnedProduct(res: Response, slug: string) {
  const creator = await findOwnedCreator(res);
  if (!creator) return null;
  return prisma.marketplaceProduct.findFirst({ where: { slug, creatorId: creator.id }, select: { id: true } });
}

export async function updateMyProduct(req: Request, res: Response) {
  const owned = await findOwnedProduct(res, String(req.params.slug));
  if (!owned) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Listing not found" } });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const data: Prisma.MarketplaceProductUpdateInput = {};
  for (const field of ["name", "type", "outcome", "description", "version"] as const) {
    if (typeof body[field] === "string") data[field] = body[field] as string;
  }
  for (const field of ["platforms", "models", "tags"] as const) {
    if (Array.isArray(body[field])) data[field] = body[field] as string[];
  }
  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.category === "string") {
    const category = await prisma.marketplaceCategory.findFirst({ where: { name: body.category } });
    if (!category) {
      res.status(400).json({ error: { code: "UNKNOWN_CATEGORY", message: "Choose one of the listed categories" } });
      return;
    }
    data.category = { connect: { id: category.id } };
  }
  const updated = await prisma.marketplaceProduct.update({
    where: { id: owned.id }, data, select: OWNED_PRODUCT_FIELDS,
  });
  res.json({ data: serializeOwnedProduct(updated) });
}

export async function deleteMyProduct(req: Request, res: Response) {
  const owned = await findOwnedProduct(res, String(req.params.slug));
  if (!owned) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Listing not found" } });
    return;
  }
  try {
    await prisma.marketplaceProduct.delete({ where: { id: owned.id } });
    res.status(204).send();
  } catch (error) {
    // Orders restrict deletion so purchase history stays intact. Unpublishing
    // is the correct outcome once a listing has been acquired by someone.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      await prisma.marketplaceProduct.update({ where: { id: owned.id }, data: { published: false } });
      res.status(200).json({ data: { unpublished: true } });
      return;
    }
    throw error;
  }
}

/** The category names a member may choose from when publishing. */
export async function listPublishingCategories(_req: Request, res: Response) {
  const categories = await prisma.marketplaceCategory.findMany({
    select: { name: true, slug: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  res.json({ data: categories });
}
