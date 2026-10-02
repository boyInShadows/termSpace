import { Router } from "express";
import { createNewsletterCampaign, exportNewsletterSubscribers, listNewsletterCampaigns, queueNewsletterCampaign, subscribeToNewsletter, unsubscribeFromNewsletter } from "../controllers/newsletterController.js";
import { validate } from "../middleware/validate.js";
import { newsletterRateLimit } from "../middleware/security.js";
import { newsletterCampaignSchema, newsletterSubscribeSchema, newsletterUnsubscribeSchema, routeIdSchema } from "../validation/schemas.js";
import { requireAdmin } from "../middleware/auth.js";
import { validateRouteParam } from "../middleware/validate.js";

const router = Router();
router.param("id", validateRouteParam("id", routeIdSchema));

router.post("/subscribers", newsletterRateLimit, validate(newsletterSubscribeSchema), subscribeToNewsletter);
router.post("/unsubscribe", newsletterRateLimit, validate(newsletterUnsubscribeSchema), unsubscribeFromNewsletter);
router.get("/admin/subscribers/export", requireAdmin, exportNewsletterSubscribers);
router.get("/admin/campaigns", requireAdmin, listNewsletterCampaigns);
router.post("/admin/campaigns", requireAdmin, validate(newsletterCampaignSchema), createNewsletterCampaign);
router.post("/admin/campaigns/:id/send", requireAdmin, queueNewsletterCampaign);

export default router;
