import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { getReportCases, reportListing } from "./reporting-api";

afterEach(() => vi.unstubAllGlobals());

it("keeps report mutations credentialed, uncached and non-retrying", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "UNAVAILABLE" } }), { status: 503 }));
  vi.stubGlobal("fetch", fetchMock);
  const input = { reason: "MALICIOUS" as const, explanation: "The installer exports credentials." };

  await expect(reportListing("tool/name", input)).rejects.toBeInstanceOf(ApiError);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("/api/marketplace/products/tool%2Fname/reports"), expect.objectContaining({ method: "POST", body: JSON.stringify(input), credentials: "include", cache: "no-store" }));
});

it("keeps private case reads uncached and connected to caller cancellation", async () => {
  const page = { data: [], meta: { page: 2, limit: 24, total: 0, totalPages: 0 } };
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();

  await expect(getReportCases("NEW", 2, controller.signal)).resolves.toEqual(page);
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith(expect.stringContaining("/api/marketplace/moderation/cases?page=2&limit=24&state=NEW"), expect.objectContaining({ credentials: "include", cache: "no-store" }));
  const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
  controller.abort();
  expect(signal.aborted).toBe(true);
});
