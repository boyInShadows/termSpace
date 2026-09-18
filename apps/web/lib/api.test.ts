import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getMarketplaceItemTypes, subscribe } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("marketplace API client reliability", () => {
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
