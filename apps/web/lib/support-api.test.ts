import { afterEach, expect, it, vi } from "vitest";
import { createSupportTicket, replySupportTicket } from "./support-api";

afterEach(() => vi.unstubAllGlobals());

it("sends screenshot multipart bodies without overriding the browser's boundary", async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ data: { id: "ticket-1" } })));
  vi.stubGlobal("fetch", fetch);
  const file = new File(["image"], "screen.png", { type: "image/png" });
  const input = { category: "TECHNICAL" as const, subject: "A problem", body: "This problem needs support." };
  await createSupportTicket(input, [file]);
  const init = fetch.mock.calls[0]![1] as RequestInit;
  expect(new Headers(init.headers).has("Content-Type")).toBe(false);
  expect((init.body as FormData).get("payload")).toBe(JSON.stringify(input));
  expect((init.body as FormData).get("screenshots")).toBe(file);
  await replySupportTicket("ticket-1", { body: "No screenshot", expectedVersion: 1 }, false);
  expect(new Headers((fetch.mock.calls[1]![1] as RequestInit).headers).get("Content-Type")).toBe("application/json");
});
