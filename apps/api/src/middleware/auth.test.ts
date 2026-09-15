import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  readerSession: { findFirst: vi.fn() },
}));

vi.mock("../lib/prisma.js", () => ({ prisma: prismaMock }));

const { requireMarketplaceRole } = await import("./auth.js");

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
  beforeEach(() => {
    vi.clearAllMocks();
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
});
