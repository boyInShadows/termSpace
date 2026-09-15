import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const creatorProfileSelect = {
  id: true,
  name: true,
  handle: true,
  initials: true,
  verified: true,
  bio: true,
  followers: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} as const;

function serializeCreatorProfile(creator: {
  _count: { products: number };
  [key: string]: unknown;
}, accessActive = true) {
  const { _count, ...profile } = creator;
  return { ...profile, products: _count.products, accessActive };
}

function initialsFor(name: string): string {
  return name.trim().split(/\s+/u).slice(0, 2).map((part) => Array.from(part)[0] ?? "").join("").toUpperCase();
}

class CreatorRoleRevokedError extends Error {}

export async function getOwnedCreatorProfile(_req: Request, res: Response) {
  const creator = await prisma.marketplaceCreator.findUnique({
    where: { ownerUserId: res.locals.reader.id as string },
    select: creatorProfileSelect,
  });
  if (!creator) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Create your creator profile to get started" } });
    return;
  }
  res.json({ data: serializeCreatorProfile(creator, res.locals.reader.marketplaceRoles.includes("creator")) });
}

export async function createOwnedCreatorProfile(req: Request, res: Response) {
  const userId = res.locals.reader.id as string;
  try {
    const creator = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 1))`;
      const [existingCreator, roleGrant] = await Promise.all([
        tx.marketplaceCreator.findUnique({ where: { ownerUserId: userId }, select: { id: true } }),
        tx.marketplaceRoleGrant.findUnique({ where: { userId_role: { userId, role: "CREATOR" } }, select: { revokedAt: true } }),
      ]);
      if (existingCreator) return null;
      if (roleGrant?.revokedAt) throw new CreatorRoleRevokedError();

      const created = await tx.marketplaceCreator.create({
        data: {
          ownerUserId: userId,
          name: req.body.name,
          handle: req.body.handle,
          bio: req.body.bio,
          initials: initialsFor(req.body.name),
        },
        select: creatorProfileSelect,
      });
      if (!roleGrant) {
        const correlationId = randomUUID();
        await tx.marketplaceRoleGrant.create({ data: { userId, role: "CREATOR" } });
        await tx.marketplaceRoleEvent.create({
          data: { subjectUserId: userId, role: "CREATOR", action: "GRANTED", actor: `reader:${userId}`, reason: "Self-service creator onboarding", correlationId },
        });
      }
      return created;
    });
    if (!creator) {
      res.status(409).json({ error: { code: "CREATOR_PROFILE_EXISTS", message: "This account already has a creator profile" } });
      return;
    }
    res.status(201).json({ data: serializeCreatorProfile(creator) });
  } catch (error) {
    if (error instanceof CreatorRoleRevokedError) {
      res.status(403).json({ error: { code: "CREATOR_ACCESS_REVOKED", message: "Creator access was revoked; contact support before onboarding" } });
      return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.map(String).join(",") : String(error.meta?.target ?? "");
      const handleConflict = target.includes("handle");
      res.status(409).json({ error: { code: handleConflict ? "CREATOR_HANDLE_TAKEN" : "CREATOR_PROFILE_EXISTS", message: handleConflict ? "That creator handle is already taken" : "This account already has a creator profile" } });
      return;
    }
    throw error;
  }
}

export async function updateOwnedCreatorProfile(req: Request, res: Response) {
  const existing = await prisma.marketplaceCreator.findUnique({
    where: { ownerUserId: res.locals.reader.id as string },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: { code: "CREATOR_PROFILE_NOT_FOUND", message: "Creator profile not found" } });
    return;
  }
  const creator = await prisma.marketplaceCreator.update({
    where: { id: existing.id },
    data: { name: req.body.name, bio: req.body.bio, initials: initialsFor(req.body.name) },
    select: creatorProfileSelect,
  });
  res.json({ data: serializeCreatorProfile(creator) });
}
