import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import multer from "multer";

/**
 * Centralized error handling.
 *
 * - 404 handler for unknown routes
 * - Validation errors (Zod) -> 400
 * - Prisma "not found" -> 404
 * - Prisma unique constraint -> 409
 * - Everything else -> 500 (details hidden in production)
 */

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "Route not found",
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === "LIMIT_FILE_SIZE";
    res.status(tooLarge ? 413 : 400).json({
      error: { code: tooLarge ? "FILE_TOO_LARGE" : "UPLOAD_ERROR", message: tooLarge ? "Uploaded file exceeds the allowed size" : err.message },
    });
    return;
  }

  if (err?.type === "entity.too.large") {
    res.status(413).json({
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the 100 KB limit" },
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body must contain valid JSON" } });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          code: issue.code,
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: "A record with this unique value already exists",
        },
      });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({
        error: {
          code: "FOREIGN_KEY",
          message: "Referenced record does not exist",
        },
      });
      return;
    }
  }

  // Fallback
  req.log?.error({
    err,
    correlationId: res.locals.correlationId,
    method: req.method,
    path: req.path,
  }, "Unhandled request error");
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "Internal server error" : err.message,
    },
  });
};
