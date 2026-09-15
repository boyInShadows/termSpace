import { Router } from "express";
import { acquireMarketplaceProduct, addMarketplaceFavorite, getMarketplaceHome, getMarketplaceProduct, listMarketplaceFavorites, listMarketplaceProducts, removeMarketplaceFavorite } from "../controllers/marketplaceController.js";
import { createOwnedCreatorProfile, getOwnedCreatorProfile, updateOwnedCreatorProfile } from "../controllers/marketplaceCreatorController.js";
import { requireMarketplaceRole, requireReader, requireVerifiedReader } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { creatorOnboardingSchema, creatorProfileUpdateSchema, marketplaceProductQuerySchema } from "../validation/schemas.js";

const router = Router();
router.get("/home", getMarketplaceHome);
router.get("/products", validate(marketplaceProductQuerySchema, "query"), listMarketplaceProducts);
router.get("/products/:slug", getMarketplaceProduct);
router.get("/creator/profile", requireReader, getOwnedCreatorProfile);
router.post("/creator/profile", requireReader, requireVerifiedReader, validate(creatorOnboardingSchema), createOwnedCreatorProfile);
router.patch("/creator/profile", requireMarketplaceRole("creator"), validate(creatorProfileUpdateSchema), updateOwnedCreatorProfile);
router.get("/favorites", requireReader, listMarketplaceFavorites);
router.put("/products/:slug/favorite", requireReader, addMarketplaceFavorite);
router.delete("/products/:slug/favorite", requireReader, removeMarketplaceFavorite);
router.post("/products/:slug/acquire", requireReader, acquireMarketplaceProduct);
export default router;
