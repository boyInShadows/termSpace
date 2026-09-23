import { Router } from "express";
import {
  createMyCreatorProfile,
  createMyProduct,
  deleteMyProduct,
  getMyCreatorProfile,
  listMyProducts,
  listPublishingCategories,
  updateMyCreatorProfile,
  updateMyProduct,
} from "../controllers/communityController.js";
import { requireReader } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createCommunityProductSchema,
  creatorProfileSchema,
  updateCommunityProductSchema,
  updateCreatorProfileSchema,
} from "../validation/schemas.js";

/**
 * Every route is reader-authenticated and scoped to the caller's own creator
 * profile. Mounted at /api/community.
 */
const router = Router();

router.get("/categories", listPublishingCategories);

router.get("/creator", requireReader, getMyCreatorProfile);
router.post("/creator", requireReader, validate(creatorProfileSchema), createMyCreatorProfile);
router.patch("/creator", requireReader, validate(updateCreatorProfileSchema), updateMyCreatorProfile);

router.get("/products", requireReader, listMyProducts);
router.post("/products", requireReader, validate(createCommunityProductSchema), createMyProduct);
router.patch("/products/:slug", requireReader, validate(updateCommunityProductSchema), updateMyProduct);
router.delete("/products/:slug", requireReader, deleteMyProduct);

export default router;
