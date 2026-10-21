import { Router } from "express";
import { getAdminSession, loginAdmin, logoutAdmin } from "../controllers/adminController.js";
import { requireAdmin } from "../middleware/auth.js";
import { adminLoginRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validate.js";
import { adminLoginSchema } from "../validation/schemas.js";

const router = Router();

router.post("/login", adminLoginRateLimit, validate(adminLoginSchema), loginAdmin);
router.post("/logout", requireAdmin, logoutAdmin);
router.get("/session", requireAdmin, getAdminSession);

export default router;
