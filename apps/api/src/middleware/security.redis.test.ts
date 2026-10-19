import express from "express";
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";

// Needs a Redis: TEST_REDIS_URL=redis://127.0.0.1:6390 npx vitest run security.redis
const url = process.env.TEST_REDIS_URL;

describe.runIf(url)("rate limits on a shared Redis store", () => {
  afterAll(async () => {
    const { redis } = await import("../lib/redis.js");
    await redis?.quit();
    vi.unstubAllEnvs();
  });

  it("counts across two separate limiter instances (two API replicas)", async () => {
    vi.stubEnv("REDIS_URL", url!);
    vi.resetModules();
    const { newsletterRateLimit } = await import("./security.js");
    vi.resetModules();
    const second = await import("./security.js");
    const replica = (limit: express.RequestHandler) => {
      const app = express();
      app.set("trust proxy", 1);
      app.post("/", limit, (_req, res) => res.sendStatus(204));
      return app;
    };
    const ip = `203.0.113.${Math.floor(Math.random() * 250)}`;
    const hit = (app: express.Express) => request(app).post("/").set("X-Forwarded-For", ip).then((r) => r.status);
    const a = replica(newsletterRateLimit);
    const b = replica(second.newsletterRateLimit);
    for (let i = 0; i < 3; i += 1) expect(await hit(a)).toBe(204);
    for (let i = 0; i < 2; i += 1) expect(await hit(b)).toBe(204);
    expect(await hit(a)).toBe(429); // 5 per hour in total, however they were split
  });
});
