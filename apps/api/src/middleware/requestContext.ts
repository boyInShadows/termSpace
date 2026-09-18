import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const correlationIdPattern = /^[A-Za-z0-9._-]{8,128}$/;

export const requestContext: RequestHandler = (req, res, next) => {
  const supplied = req.get("x-correlation-id");
  const correlationId = supplied && correlationIdPattern.test(supplied) ? supplied : randomUUID();
  (req as typeof req & { id: string }).id = correlationId;
  res.locals.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);

  const sendJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode >= 400 && body && typeof body === "object" && "error" in body) {
      const response = body as { error?: unknown };
      if (response.error && typeof response.error === "object") {
        body = { ...response, error: { ...(response.error as Record<string, unknown>), correlationId } };
      }
    }
    return sendJson(body);
  }) as typeof res.json;
  next();
};
