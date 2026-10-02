import { Router } from "express";
import { approveComment, curateComment, deleteComment, listAdminComments, listPublicComments } from "../controllers/commentController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate, validateRouteParam } from "../middleware/validate.js";
import { commentCurationSchema, routeIdSchema } from "../validation/schemas.js";

const router = Router();
router.param("id", validateRouteParam("id", routeIdSchema));
router.get("/", listPublicComments);
router.get("/admin", requireAdmin, listAdminComments);
router.put("/:id/approve", requireAdmin, approveComment);
router.put("/:id/curated", requireAdmin, validate(commentCurationSchema), curateComment);
router.delete("/:id", requireAdmin, deleteComment);
export default router;
