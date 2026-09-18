import { Router } from "express";
import { createSeries, deleteSeries, getSeries, listSeries, updateSeries } from "../controllers/taxonomyController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate, validateRouteParam } from "../middleware/validate.js";
import { contentTaxonomySchema, routeIdSchema, routeSlugSchema } from "../validation/schemas.js";

const router = Router();
router.param("id", validateRouteParam("id", routeIdSchema));
router.param("slug", validateRouteParam("slug", routeSlugSchema));
router.get("/", listSeries);
router.get("/:slug", getSeries);
router.post("/", requireAdmin, validate(contentTaxonomySchema), createSeries);
router.put("/:id", requireAdmin, validate(contentTaxonomySchema.partial()), updateSeries);
router.delete("/:id", requireAdmin, deleteSeries);
export default router;
