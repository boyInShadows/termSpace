import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() },
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));

const { requireMarketplaceRole, optionalReader } = await import("./auth.js");

function requestWithSessionCookie() {
  return {
    cookies: { term_academy_reader: "abcdefghijklmnopqrstuvwxyz123456" },
  } as unknown as Request;
}

function responseStub() {
  const response = {
    locals: {},
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe("marketplace role authorization", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
  });

  it("requires a reader session", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue(null);
    const response = responseStub();
    const next = vi.fn();

    await requireMarketplaceRole("creator")(requestWithSessionCookie(), response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      error: { code: "UNAUTHORIZED", message: "Sign in to access this marketplace area" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an unverified account even when a role record is returned", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: {
        id: "reader-1",
        email: "reader@example.com",
        emailVerifiedAt: null,
        marketplaceRoleGrants: [{ role: "CREATOR" }],
      },
    });
    const response = responseStub();
    const next = vi.fn();

    await requireMarketplaceRole("creator")(requestWithSessionCookie(), response, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "EMAIL_VERIFICATION_REQUIRED",
        message: "Verify your email before using creator or moderation tools",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a verified account without an allowed active role", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: {
        id: "reader-1",
        email: "reader@example.com",
        emailVerifiedAt: new Date("2026-09-15T00:00:00.000Z"),
        marketplaceRoleGrants: [],
      },
    });
    const response = responseStub();
    const next = vi.fn();

    await requireMarketplaceRole("moderator", "administrator")(
      requestWithSessionCookie(),
      response,
      next,
    );

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      error: {
        code: "MARKETPLACE_ROLE_REQUIRED",
        message: "Your account does not have the required marketplace role",
      },
    });
    expect(next).not.toHaveBeenCalled();
    const query = prismaMock.readerSession.findFirst.mock.calls[0][0];
    expect(query.select.user.select.marketplaceRoleGrants.where).toEqual({ revokedAt: null });
  });

  it("authorizes an explicitly allowed active role", async () => {
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: {
        id: "reader-1",
        email: "moderator@example.com",
        emailVerifiedAt: new Date("2026-09-15T00:00:00.000Z"),
        marketplaceRoleGrants: [{ role: "MODERATOR" }],
      },
    });
    const response = responseStub();
    const next = vi.fn();

    await requireMarketplaceRole("moderator", "administrator")(
      requestWithSessionCookie(),
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(response.status).not.toHaveBeenCalled();
    expect(response.locals.reader).toEqual({
      id: "reader-1",
      email: "moderator@example.com",
      emailVerified: true,
      marketplaceRoles: ["moderator"],
    });
  });

  it("temporarily accepts existing localhost sessions without granting roles or changing verification records", async () => {
    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "true");
    vi.stubEnv("WEB_PUBLIC_URL", "http://localhost:3000");
    prismaMock.readerSession.findFirst.mockResolvedValue({
      id: "session-1",
      user: { id: "reader-1", email: "reader@example.com", emailVerifiedAt: null, marketplaceRoleGrants: [] },
    });
    const response = responseStub();
    const next = vi.fn();
    await optionalReader(requestWithSessionCookie(), response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(response.locals.reader.emailVerified).toBe(true);
    expect(response.locals.reader.marketplaceRoles).toEqual([]);

    await requireMarketplaceRole("creator")(requestWithSessionCookie(), response, vi.fn());
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ code: "MARKETPLACE_ROLE_REQUIRED" }) }));

    vi.stubEnv("LOCAL_AUTO_VERIFY_EMAIL", "false");
    await optionalReader(requestWithSessionCookie(), response, vi.fn());
    expect(response.locals.reader.emailVerified).toBe(false);
  });
});
