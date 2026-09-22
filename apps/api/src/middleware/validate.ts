import type { RequestHandler, RequestParamHandler } from "express";
import { ZodError, type ZodSchema, type ZodType } from "zod";

/**
 * Middleware factory that validates a request part against a Zod schema.
 * On failure, throws a ZodError which the centralized error handler turns
 * into a 400 response.
 */
export function validate(schema: ZodSchema, part: "body" | "query" | "params" = "body"): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Express 5 exposes `req.query` through a getter that reparses on access.
    // Define a request-local value so downstream handlers receive Zod's
    // coerced query values.
    if (part === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else if (part === "body") {
      req.body = result.data;
    } else {
      req.params = result.data as typeof req.params;
    }
    next();
  };
}

export function validateRouteParam(name: string, schema: ZodType<string>): RequestParamHandler {
  return (req, _res, next, value) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      next(new ZodError(result.error.issues.map((issue) => ({ ...issue, path: [name, ...issue.path] }))));
      return;
    }
    req.params[name] = result.data;
    next();
  };
}
