import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRateLimit } from "./security.js";

function appBehindProxy() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(apiRateLimit);
  app.get("/ping", (_req, res) => res.json({ ok: true }));
  return app;
}

const statuses = (app: express.Express, header?: string) =>
  Promise.all(Array.from({ length: 301 }, () => {
    const req = request(app).get("/ping");
    return (header ? req.set("X-Forwarded-For", header) : req).then((res) => res.status);
  }));

describe("apiRateLimit behind a trusted proxy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("counts proxied browser traffic per client", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    expect(await statuses(appBehindProxy(), "203.0.113.7")).toContain(429);
  });

  it("does not count direct server-side calls that carry no X-Forwarded-For", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    expect(await statuses(appBehindProxy())).not.toContain(429);
  });

  it("still counts header-less calls when no proxy is trusted", async () => {
    vi.stubEnv("TRUST_PROXY", "0");
    expect(await statuses(appBehindProxy())).toContain(429);
  });
});
