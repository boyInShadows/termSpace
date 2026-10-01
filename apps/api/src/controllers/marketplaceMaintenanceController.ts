import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { MarketplaceRequestError } from "../lib/marketplaceRequestError.js";

export async function updateMarketplaceMaintenance(req: Request, res: Response) {
  const product = await prisma.marketplaceProduct.findFirst({
    where: { id: String(req.params.id), creator: { ownerUserId: res.locals.reader.id as string } },
    select: { id: true },
  });
  if (!product) throw new MarketplaceRequestError(404, "LISTING_NOT_FOUND", "Listing not found");
  const updated = await prisma.marketplaceProduct.update({
    where: { id: product.id },
    data: { maintenanceStatus: req.body.status, maintenanceNote: req.body.status === "ACTIVE" ? null : req.body.note },
    select: { maintenanceStatus: true, maintenanceNote: true },
  });
  res.json({ data: updated });
}
