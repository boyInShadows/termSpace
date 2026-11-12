import request from "supertest";
import { describe, expect, it, vi } from "vitest";
const fixtures = vi.hoisted(() => ({ error: vi.fn(), session: vi.fn(), create: vi.fn() }));
vi.mock("pino-http", () => ({ pinoHttp: () => (req: { log: unknown }, _res: unknown, next: () => void) => { req.log = { error: fixtures.error }; next(); } }));
vi.mock("../lib/prisma.js", () => {
  const tx = { $executeRaw: vi.fn(), readerUser: { count: vi.fn().mockResolvedValue(1) }, supportTicket: { create: fixtures.create } };
  return { prisma: { readerSession: { findFirst: fixtures.session }, $transaction: (callback: (client: typeof tx) => unknown) => callback(tx) } };
});
import { createApp } from "../app.js";
describe("private support failures", () => {
  it("never logs private query arguments or returns them when the database fails", async () => {
    fixtures.session.mockResolvedValue({ id: "session", user: { id: "reader", email: "private@test.invalid", emailVerifiedAt: new Date(), marketplaceRoleGrants: [] } });
    const body = "secret private conversation text";
    fixtures.create.mockRejectedValue(new Error(`Invalid query arguments: ${body}`));
    const response = await request(createApp()).post("/api/support").set("Origin", "http://localhost:3000").set("Cookie", `term_academy_reader=${"a".repeat(40)}`).send({ category: "GENERAL", subject: "Help", message: body });
    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("SUPPORT_UNAVAILABLE");
    expect(JSON.stringify(response.body)).not.toContain(body);
    expect(fixtures.error).toHaveBeenCalledWith({ event: "support_request_failed", errorName: "Error" }, "Private support request failed");
    expect(JSON.stringify(fixtures.error.mock.calls)).not.toContain(body);
  });
});
