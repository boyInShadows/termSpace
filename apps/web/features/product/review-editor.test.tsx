import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const api = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ request: api }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ loading: false, email: "reader@example.com" }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ fa: false, locale: "en" }) }));
const { ReviewEditor } = await import("./review-editor");

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); });

it("uses a labeled rating group and sends the selected rating for an eligible reader", async () => {
  api.mockResolvedValueOnce({ data: { eligible: true, reason: null, review: null } })
    .mockResolvedValueOnce({ data: { id: "review-1", rating: 3, body: "A thoughtful review of this useful tool.", status: "HELD", version: 0 } });
  render(<ReviewEditor slug="sample" />);
  expect(await screen.findByRole("group", { name: "Rating" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "3" }));
  fireEvent.change(screen.getByLabelText("Your experience"), { target: { value: "A thoughtful review of this useful tool." } });
  fireEvent.submit(screen.getByRole("button", { name: "Save review" }).closest("form")!);
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  expect(JSON.parse(api.mock.calls[1][1].body)).toEqual({ rating: 3, body: "A thoughtful review of this useful tool." });
  expect(screen.getByRole("status")).toHaveTextContent("awaiting moderation");
});

it("explains acquisition eligibility without showing a submission form", async () => {
  api.mockResolvedValueOnce({ data: { eligible: false, reason: "ACQUISITION_REQUIRED", review: null } });
  render(<ReviewEditor slug="sample" />);
  expect(await screen.findByText(/Add this listing to your library/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save review" })).toBeNull();
});
