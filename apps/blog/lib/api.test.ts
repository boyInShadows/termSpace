import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("blog API client reliability", () => {
  it("cancels a transient response body before retrying a read", async () => {
    const transientResponse = new Response(JSON.stringify({ error: { code: "UNAVAILABLE" } }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
    const cancel = vi.spyOn(transientResponse.body!, "cancel");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(transientResponse)
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.listCategories()).resolves.toEqual({ data: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledOnce();
  });
});
