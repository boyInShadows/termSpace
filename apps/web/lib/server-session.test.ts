import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const getHome = vi.hoisted(() => vi.fn());
const requestHeaders = vi.hoisted(() => ({ value: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => requestHeaders.value }));
vi.mock("./api", () => ({ getSession }));
vi.mock("./dashboard", () => ({ getDashboardHome: getHome }));
const { getServerSession, getServerDashboardHome } = await import("./server-session");

describe("dashboard server session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestHeaders.value = new Headers({ "x-term-path": "/dashboard", cookie: "reader=synthetic" });
  });

  it.each(["/", "/explore", "/dashboard-example"])("does not look up private identity on %s", async (path) => {
    requestHeaders.value.set("x-term-path", path);
    expect(await getServerSession()).toBeUndefined();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("does not look up identity without a cookie", async () => {
    requestHeaders.value.delete("cookie");
    expect(await getServerSession()).toBeUndefined();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("forwards the current request cookie and returns only its identity", async () => {
    requestHeaders.value.set("x-term-path", "/dashboard/library");
    const data = { authenticated: true, user: { email: "reader@example.com", emailVerified: true, marketplaceRoles: [] } };
    getSession.mockResolvedValue({ data });
    expect(await getServerSession()).toEqual(data);
    expect(getSession).toHaveBeenCalledWith({ headers: { cookie: "reader=synthetic" }, cache: "no-store", signal: expect.any(AbortSignal) });
  });

  it("falls back to client verification on a failed server lookup", async () => {
    getSession.mockRejectedValue(new Error("offline"));
    expect(await getServerSession()).toBeUndefined();
  });

  it.each([{ authenticated: false }, { authenticated: true, user: { email: "reader@example.com", emailVerified: false } }])("does not fetch dashboard data for an unverified or anonymous reader", async (data) => {
    getSession.mockResolvedValue({ data });
    expect(await getServerDashboardHome()).toBeUndefined();
    expect(getHome).not.toHaveBeenCalled();
  });

  it("binds the dashboard snapshot to the verified identity and its request cookie", async () => {
    getSession.mockResolvedValue({ data: { authenticated: true, user: { email: "reader@example.com", emailVerified: true } } });
    getHome.mockResolvedValue({ kind: "no-profile" });
    expect(await getServerDashboardHome()).toEqual({ email: "reader@example.com", home: { kind: "no-profile" } });
    expect(getHome).toHaveBeenCalledWith(expect.any(AbortSignal), { cookie: "reader=synthetic" });
  });

  it("lets the client retry failed dashboard reads", async () => {
    getSession.mockResolvedValue({ data: { authenticated: true, user: { email: "reader@example.com", emailVerified: true } } });
    getHome.mockRejectedValue(new Error("offline"));
    expect(await getServerDashboardHome()).toBeUndefined();
  });
});
