import { Router } from "express";
import { createEdition, deleteEdition, getCurrentEdition, getEdition, listAdminEditions, listEditions, updateEdition } from "../controllers/editionController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate, validateRouteParam } from "../middleware/validate.js";
import { editionSchema, routeIdSchema, routeSlugSchema, updateEditionSchema } from "../validation/schemas.js";

const router = Router();
router.param("id", validateRouteParam("id", routeIdSchema));
router.param("slug", validateRouteParam("slug", routeSlugSchema));
router.get("/", listEditions);
router.get("/current", getCurrentEdition);
router.get("/admin", requireAdmin, listAdminEditions);
router.post("/admin", requireAdmin, validate(editionSchema), createEdition);
router.put("/admin/:id", requireAdmin, validate(updateEditionSchema), updateEdition);
router.delete("/admin/:id", requireAdmin, deleteEdition);
router.get("/:slug", getEdition);
export default router;
