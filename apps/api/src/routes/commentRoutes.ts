import { Router } from "express";
import { approveComment, deleteComment, listAdminComments, listPublicComments } from "../controllers/commentController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validateRouteParam } from "../middleware/validate.js";
import { routeIdSchema } from "../validation/schemas.js";

const router = Router();
router.param("id", validateRouteParam("id", routeIdSchema));
router.get("/", listPublicComments);
router.get("/admin", requireAdmin, listAdminComments);
router.put("/:id/approve", requireAdmin, approveComment);
router.delete("/:id", requireAdmin, deleteComment);
export default router;
