import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getFavorites, getMarketplaceItemTypes, getProduct, getProducts, loginWithGoogle, subscribe } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("marketplace API client reliability", () => {
  it("submits Google credentials once to the shared reader endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { authenticated: true } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await loginWithGoogle("signed-google-token");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/readers/google"), expect.objectContaining({ method: "POST", credentials: "include", body: JSON.stringify({ credential: "signed-google-token" }) }));
  });
  it("retries one transient GET failure", async () => {
    const transientResponse = new Response(JSON.stringify({ error: { code: "UNAVAILABLE" } }), { status: 503, headers: { "Content-Type": "application/json" } });
    const cancel = vi.spyOn(transientResponse.body!, "cancel");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(transientResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getMarketplaceItemTypes()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("does not retry mutations and exposes validation details and correlation IDs", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [{ path: "email", code: "invalid_format", message: "Invalid email" }],
        correlationId: "request-12345678",
      },
    }), { status: 400, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const error = await subscribe("bad").catch((cause) => cause);
    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) throw new Error("Expected ApiError");
    expect(error).toMatchObject({ status: 400, code: "VALIDATION_ERROR", correlationId: "request-12345678" });
    expect(error.details).toEqual([expect.objectContaining({ path: "email" })]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("marketplace API client caching", () => {
  const ok = () => new Response(JSON.stringify({ data: [], meta: {} }), { status: 200, headers: { "Content-Type": "application/json" } });
  function stubFetch() {
    const fetchMock = vi.fn().mockImplementation(async () => ok());
    vi.stubGlobal("fetch", fetchMock);
    return () => fetchMock.mock.calls[0][1] as RequestInit & { next?: { revalidate: number } };
  }
  const onServer = () => vi.stubGlobal("window", undefined);

  it("lets the server reuse public catalogue reads for a short while", async () => {
    onServer();
    const init = stubFetch();

    await getMarketplaceItemTypes();

    expect(init().next).toEqual({ revalidate: 30 });
    expect(init().cache).toBeUndefined();
  });

  it.each([
    ["a listing", () => getProduct("some-skill").catch(() => undefined)],
    ["the catalogue", () => getProducts({})],
    ["a whitespace-only search", () => getProducts({ q: "   " })],
  ])("caches %s on the server", async (_label, call) => {
    onServer();
    const init = stubFetch();

    await call();

    expect(init().next).toEqual({ revalidate: 30 });
  });

  it("never caches a search term, which is almost never asked twice", async () => {
    onServer();
    const init = stubFetch();

    await getProducts({ q: "review" });

    expect(init().cache).toBe("no-store");
    expect(init().next).toBeUndefined();
  });

  it("never caches anything that belongs to a signed-in reader", async () => {
    onServer();
    const init = stubFetch();

    await getFavorites();

    expect(init().cache).toBe("no-store");
    expect(init().next).toBeUndefined();
  });

  it("leaves caching to the browser's own rules in the browser", async () => {
    const init = stubFetch();

    await getMarketplaceItemTypes();

    expect(init().cache).toBe("no-store");
    expect(init().next).toBeUndefined();
  });
});
