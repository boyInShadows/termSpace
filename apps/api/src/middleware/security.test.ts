import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRateLimit, loginRateLimit, registerRateLimit, reportWriteRateLimit, reviewWriteRateLimit, searchRateLimit } from "./security.js";

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

describe("per-endpoint auth limiters and search limiter", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps the reporting budget separate from review writes", async () => {
    const app = express();
    app.post("/reports", reportWriteRateLimit, (_req, res) => res.sendStatus(204));
    app.post("/reviews", reviewWriteRateLimit, (_req, res) => res.sendStatus(204));
    for (let i = 0; i < 20; i += 1) expect((await request(app).post("/reports")).status).toBe(204);
    expect((await request(app).post("/reports")).status).toBe(429);
    expect((await request(app).post("/reviews")).status).toBe(204);
  });

  it("does not let failed logins use up the registration budget", async () => {
    const app = express();
    app.post("/login", loginRateLimit, (_req, res) => res.sendStatus(401));
    app.post("/register", registerRateLimit, (_req, res) => res.sendStatus(201));
    for (let i = 0; i < 11; i += 1) await request(app).post("/login");
    expect((await request(app).post("/login")).status).toBe(429);
    expect((await request(app).post("/register")).status).toBe(201);
  });

  it("limits text search but not plain browsing, and counts forwarded visitors", async () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const search = express();
    search.set("trust proxy", 1);
    search.get("/products", searchRateLimit, (_req, res) => res.json({ ok: true }));
    const hit = (path: string, ip?: string) => {
      const req = request(search).get(path);
      return (ip ? req.set("X-Forwarded-For", ip) : req).then((res) => res.status);
    };
    for (let i = 0; i < 40; i += 1) expect(await hit("/products?page=2", "198.51.100.1")).toBe(200);
    const results = [];
    for (let i = 0; i < 31; i += 1) results.push(await hit("/products?q=agent", "198.51.100.2"));
    expect(results.at(-1)).toBe(429);
    for (let i = 0; i < 40; i += 1) expect(await hit("/products?q=agent")).toBe(200);
  });
});
