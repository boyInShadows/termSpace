import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() },
  readerUser: { findUnique: vi.fn(), update: vi.fn() },
}));
vi.mock("../lib/prisma.js", () => ({ prisma: db }));
const { createApp } = await import("../app.js");
const { authRateLimiters } = await import("../middleware/security.js");
const cookie = "term_academy_reader=abcdefghijklmnopqrstuvwxyz123456";
const answers = { role: "developer", goal: "discover", tools: ["codex", "claude_code"], intent: "create" };
const stored = {
  onboardingRequired: true, onboardingRole: null, onboardingGoal: null, onboardingTools: [], onboardingIntent: null,
};

describe("private account onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const limiter of authRateLimiters) limiter.resetKey("::ffff:127.0.0.1");
    db.readerSession.findFirst.mockResolvedValue({
      id: "session-1", user: { id: "reader-1", email: "member@example.test", emailVerifiedAt: null, marketplaceRoleGrants: [] },
    });
    db.readerUser.findUnique.mockResolvedValue(stored);
    db.readerUser.update.mockResolvedValue({
      onboardingRequired: false, onboardingRole: answers.role, onboardingGoal: answers.goal,
      onboardingTools: answers.tools, onboardingIntent: answers.intent,
    });
  });

  it("requires authentication for both reading and saving", async () => {
    expect((await request(createApp()).get("/api/readers/onboarding")).status).toBe(401);
    expect((await request(createApp()).put("/api/readers/onboarding").send(answers)).status).toBe(401);
    expect(db.readerUser.update).not.toHaveBeenCalled();
  });

  it("reads only the caller's answers and prevents caching", async () => {
    const res = await request(createApp()).get("/api/readers/onboarding").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toContain("no-store");
    expect(res.body).toEqual({ data: { required: true, role: null, goal: null, tools: [], intent: null } });
    expect(db.readerUser.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "reader-1" } }));
  });

  it("saves all four answers for the caller without granting a role", async () => {
    const res = await request(createApp()).put("/api/readers/onboarding")
      .set("Cookie", cookie).set("Origin", "http://localhost:3000").send(answers);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { ...answers, required: false } });
    expect(db.readerUser.update).toHaveBeenCalledWith({
      where: { id: "reader-1" },
      data: { onboardingRole: answers.role, onboardingGoal: answers.goal, onboardingTools: answers.tools, onboardingIntent: answers.intent, onboardingRequired: false },
      select: expect.any(Object),
    });
  });

  it.each([
    { ...answers, role: "administrator" }, { ...answers, goal: "" }, { ...answers, intent: "https://evil.test" },
    { ...answers, tools: [] }, { ...answers, tools: ["codex", "codex"] },
    { ...answers, tools: ["getting_started", "codex"] }, { ...answers, tools: ["unrecognized"] },
    { ...answers, userId: "other-reader" }, { ...answers, onboardingRequired: true },
  ])("rejects invalid or forged input: %j", async (body) => {
    const res = await request(createApp()).put("/api/readers/onboarding")
      .set("Cookie", cookie).set("Origin", "http://localhost:3000").send(body);
    expect(res.status).toBe(400);
    expect(db.readerUser.update).not.toHaveBeenCalled();
  });

  it("rejects cross-origin writes", async () => {
    const res = await request(createApp()).put("/api/readers/onboarding")
      .set("Cookie", cookie).set("Origin", "https://evil.test").send(answers);
    expect(res.status).toBe(403);
    expect(db.readerUser.update).not.toHaveBeenCalled();
  });
});
