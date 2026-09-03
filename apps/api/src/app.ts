import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import articleRoutes from "./routes/articleRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authorRoutes from "./routes/authorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import seriesRoutes from "./routes/seriesRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import readerRoutes from "./routes/readerRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import editionRoutes from "./routes/editionRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { apiRateLimit, csrfProtection } from "./middleware/security.js";
import { prisma } from "./lib/prisma.js";

export function createApp() {
  const app = express();

  if (process.env.TRUST_PROXY && process.env.TRUST_PROXY !== "0") {
    app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  }

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(pinoHttp({
    level: process.env.NODE_ENV === "test" ? "silent" : "info",
    redact: ["req.headers.authorization", "req.headers.cookie", "res.headers.set-cookie"],
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if ((process.env.MEDIA_STORAGE ?? "local") === "local") {
    app.use("/media", express.static("uploads", { immutable: true, maxAge: "1y" }));
  }

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: origins,
      credentials: true,
    }),
  );
  app.use(apiRateLimit);
  app.use(csrfProtection);

  // Health check
  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok" });
    } catch (error) {
      _req.log?.error({ err: error }, "Database health check failed");
      res.status(503).json({ status: "degraded", error: { code: "DATABASE_UNAVAILABLE", message: "Database is not ready" } });
    }
  });

  app.use("/api/articles", articleRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/authors", authorRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/newsletter", newsletterRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/api/tags", tagRoutes);
  app.use("/api/series", seriesRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/readers", readerRoutes);
  app.use("/api/resources", resourceRoutes);
  app.use("/api/editions", editionRoutes);
  app.use("/api/marketplace", marketplaceRoutes);
  app.use("/api/community", communityRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
