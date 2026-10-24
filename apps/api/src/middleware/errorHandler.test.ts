import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "./errorHandler.js";

function internalErrorMessage() {
  const json = vi.fn();
  const res = { locals: {}, status: vi.fn().mockReturnThis(), json } as unknown as Response;
  errorHandler(new Error("connect ECONNREFUSED db:5432"), { log: { error: vi.fn() } } as unknown as Request, res, vi.fn());
  return json.mock.calls[0][0].error.message;
}

describe("errorHandler 500 message", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["production", "test", ""])("hides details when NODE_ENV=%j", (env) => {
    vi.stubEnv("NODE_ENV", env);
    expect(internalErrorMessage()).toBe("Internal server error");
  });

  it("shows details only in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(internalErrorMessage()).toContain("ECONNREFUSED");
  });
});
