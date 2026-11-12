import { Router, type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { changeSupportTicket, createSupportTicket, getSupportTicket, listSupportTickets } from "../controllers/supportController.js";
import { SupportError } from "../lib/supportAccess.js";
import { requireMarketplaceRole, requireReader } from "../middleware/auth.js";
import { supportWriteRateLimit } from "../middleware/security.js";
import { validate, validateRouteParam } from "../middleware/validate.js";
import { routeIdSchema, supportCreateSchema, supportListSchema, supportMessagesSchema, supportReplySchema, supportResolveSchema } from "../validation/schemas.js";

const router = Router();
router.use((_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
router.param("ticketId", validateRouteParam("ticketId", routeIdSchema));
const staff = requireMarketplaceRole("administrator", "moderator");
router.get("/inbox", staff, validate(supportListSchema, "query"), listSupportTickets(true));
router.get("/inbox/:ticketId", staff, validate(supportMessagesSchema, "query"), getSupportTicket(true));
router.post("/inbox/:ticketId/replies", staff, supportWriteRateLimit, validate(supportReplySchema), changeSupportTicket(true, false));
router.post("/inbox/:ticketId/resolve", staff, supportWriteRateLimit, validate(supportResolveSchema), changeSupportTicket(true, true));
router.get("/", requireReader, validate(supportListSchema, "query"), listSupportTickets(false));
router.post("/", requireReader, supportWriteRateLimit, validate(supportCreateSchema), createSupportTicket);
router.get("/:ticketId", requireReader, validate(supportMessagesSchema, "query"), getSupportTicket(false));
router.post("/:ticketId/replies", requireReader, supportWriteRateLimit, validate(supportReplySchema), changeSupportTicket(false, false));
router.post("/:ticketId/resolve", requireReader, supportWriteRateLimit, validate(supportResolveSchema), changeSupportTicket(false, true));
const supportError: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof SupportError) { res.status(error.status).json({ error: { code: error.code, message: error.message } }); return; }
  if (error instanceof ZodError) { next(error); return; }
  // Prisma error messages can contain query arguments, including private message text.
  req.log?.error({ event: "support_request_failed", errorName: error instanceof Error ? error.name : "UnknownError" }, "Private support request failed");
  res.status(500).json({ error: { code: "SUPPORT_UNAVAILABLE", message: "Support is temporarily unavailable. Please try again." } });
};
router.use(supportError);
export default router;
