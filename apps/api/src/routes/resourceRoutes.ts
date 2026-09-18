import { Router } from "express";
import multer from "multer";
import { deleteResource, downloadPublishedResource, getPublishedResource, listAdminResources, listPublishedResources, updateResource, uploadResource } from "../controllers/resourceController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate, validateRouteParam } from "../middleware/validate.js";
import { markdownResourceMetadataSchema, routeIdSchema, routeSlugSchema, updateMarkdownResourceSchema } from "../validation/schemas.js";

const router = Router();
router.param("id", validateRouteParam("id", routeIdSchema));
router.param("slug", validateRouteParam("slug", routeSlugSchema));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024, files: 1 } });
router.get("/", listPublishedResources);
router.get("/admin", requireAdmin, listAdminResources);
router.post("/admin", requireAdmin, upload.single("file"), validate(markdownResourceMetadataSchema), uploadResource);
router.put("/admin/:id", requireAdmin, validate(updateMarkdownResourceSchema), updateResource);
router.delete("/admin/:id", requireAdmin, deleteResource);
router.get("/:slug/download", downloadPublishedResource);
router.get("/:slug", getPublishedResource);
export default router;
