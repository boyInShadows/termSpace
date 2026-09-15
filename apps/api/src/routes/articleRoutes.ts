import { Router } from "express";
import {
  listArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticlePreview,
  listArticleRevisions,
  restoreArticleRevision,
  listPopularSearches,
} from "../controllers/articleController.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  articleQuerySchema,
  createArticleSchema,
  updateArticleSchema,
} from "../validation/schemas.js";
import { createComment } from "../controllers/commentController.js";
import { commentSchema } from "../validation/schemas.js";
import { commentRateLimit } from "../middleware/security.js";

const router = Router();

router.get("/", validate(articleQuerySchema, "query"), listArticles);
router.get("/search/popular", listPopularSearches);
router.get("/preview/:token", requireAdmin, getArticlePreview);
router.get("/id/:id", requireAdmin, getArticleById);
router.get("/:id/revisions", requireAdmin, listArticleRevisions);
router.post("/:id/revisions/:revisionId/restore", requireAdmin, restoreArticleRevision);
router.post("/:slug/comments", commentRateLimit, validate(commentSchema), createComment);
router.get("/:slug", getArticleBySlug);
router.post("/", requireAdmin, validate(createArticleSchema), createArticle);
router.put("/:id", requireAdmin, validate(updateArticleSchema), updateArticle);
router.delete("/:id", requireAdmin, deleteArticle);

export default router;
