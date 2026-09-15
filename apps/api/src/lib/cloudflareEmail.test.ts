import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendVerificationEmail } from "./cloudflareEmail.js";

describe("Cloudflare transactional email", () => {
  beforeEach(() => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "account-id";
    process.env.CLOUDFLARE_EMAIL_API_TOKEN = "api-token";
    process.env.EMAIL_FROM_ADDRESS = "account@termspace.example";
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("accepts queued provider responses and sends both body formats", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: { queued: ["reader@example.com"] } }), { status: 200 }));
    const result = await sendVerificationEmail({ to: "reader@example.com", verificationUrl: "https://termspace.example/account/verify-email#token=secret", correlationId: "correlation-1" }, fetchMock);
    expect(result).toEqual({ outcome: "sent", statusCode: 200 });
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body).toMatchObject({ to: "reader@example.com", subject: "Verify your TermSpace email", text: expect.any(String), html: expect.any(String) });
    expect(request.headers).toMatchObject({ "X-Correlation-ID": "correlation-1" });
  });

  it.each([429, 500, 503])("retries retryable HTTP %s failures", async (status) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status }));
    await expect(sendVerificationEmail({ to: "reader@example.com", verificationUrl: "https://example.com/#token=x", correlationId: "correlation-2" }, fetchMock)).resolves.toMatchObject({ outcome: "retry", statusCode: status });
  });

  it("does not retry authentication failures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(sendVerificationEmail({ to: "reader@example.com", verificationUrl: "https://example.com/#token=x", correlationId: "correlation-3" }, fetchMock)).resolves.toEqual({ outcome: "failed", statusCode: 401, errorCode: "HTTP_401" });
  });
});
