import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ProductDetail, DiscoveryOptions } from "@/lib/types";

const api = vi.hoisted(() => ({ request: vi.fn(), products: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({
  ...(await original<typeof import("@/lib/api")>()),
  request: api.request,
  getProducts: api.products,
}));
vi.mock("@/features/account/marketplace-session", () => ({
  useMarketplaceSession: () => ({
    email: "reader@example.com",
    marketplaceRoles: [],
  }),
}));
const { ReportResource } = await import("@/features/product/report-resource");
const { DiscoveryExperience } =
  await import("@/features/discovery/discovery-experience");
const { TrustCases } = await import("./trust-cases");
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  api.request.mockResolvedValue({ data: [], meta: { totalPages: 1 } });
  api.products.mockResolvedValue({
    data: [],
    meta: { page: 1, total: 0, totalPages: 0 },
  });
});

it("submits the chosen report scope and preserves a failed explanation for retry", async () => {
  api.request
    .mockRejectedValueOnce(new Error("Service unavailable"))
    .mockResolvedValueOnce({ data: { accepted: true } });
  render(
    <ReportResource
      product={
        {
          id: "product-1",
          slug: "sample",
          creator: { id: "creator-1" },
          currentReleaseId: "release-1",
          reviews: [],
        } as unknown as ProductDetail
      }
    />,
  );
  fireEvent.change(screen.getByLabelText("Report target"), {
    target: { value: "2" },
  });
  const explanation = screen.getByLabelText("Explanation and evidence");
  fireEvent.change(explanation, {
    target: { value: "This pinned release behaves unexpectedly." },
  });
  fireEvent.submit(explanation.closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Service unavailable",
  );
  expect(explanation).toHaveValue("This pinned release behaves unexpectedly.");
  fireEvent.submit(explanation.closest("form")!);
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("submitted"),
  );
  expect(JSON.parse(api.request.mock.calls[1][1].body)).toEqual({
    targetType: "RELEASE",
    targetId: "release-1",
    reason: "MALICIOUS",
    explanation: "This pinned release behaves unexpectedly.",
  });
});

it("combines independent community and canonical platform/model filters", async () => {
  const options = {
    platforms: [{ key: "codex", name: "Codex" }],
    models: [{ key: "gpt-5", name: "GPT-5" }],
    categories: [],
    communities: [{ slug: "codex", nameEn: "Codex community" }],
  } as unknown as DiscoveryOptions;
  render(
    <DiscoveryExperience
      initial={{
        data: [],
        meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
      }}
      initialFilters={{}}
      options={options}
      itemTypes={[]}
    />,
  );
  fireEvent.change(screen.getByLabelText("Community"), {
    target: { value: "codex" },
  });
  fireEvent.change(screen.getByLabelText("Model"), {
    target: { value: "gpt-5" },
  });
  fireEvent.click(screen.getByLabelText("Codex"));
  await waitFor(() =>
    expect(api.products).toHaveBeenCalledWith(
      expect.objectContaining({
        community: "codex",
        platform: "codex",
        model: "gpt-5",
        page: 1,
      }),
      expect.any(AbortSignal),
    ),
  );
});

it("links an appeal to its selected decision without restoring content optimistically", async () => {
  api.request.mockResolvedValue({
    data: [
      {
        id: "case-1",
        targetType: "PRODUCT",
        targetId: "product-1",
        state: "ACTIONED",
        severity: "HIGH",
        version: 1,
        publicReason: "Under investigation",
        events: [
          {
            id: "event-1",
            action: "RESTRICT",
            publicReason: "Under investigation",
          },
        ],
        restrictions: [],
        appeals: [],
      },
    ],
    meta: { totalPages: 1 },
  });
  render(<TrustCases />);
  const explanation = await screen.findByLabelText("Appeal explanation");
  fireEvent.change(explanation, {
    target: { value: "Please review this decision again." },
  });
  fireEvent.change(screen.getByLabelText("New supporting evidence"), {
    target: { value: "The source was checked and the cause was corrected." },
  });
  fireEvent.submit(explanation.closest("form")!);
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      "/api/marketplace/cases/case-1/appeals",
      expect.objectContaining({ method: "POST" }),
    ),
  );
  const submission = api.request.mock.calls.find(
    ([path, init]) => path.includes("/appeals") && init?.method === "POST",
  );
  expect(JSON.parse(submission![1].body).decisionEventId).toBe("event-1");
  expect(screen.getByText("ACTIONED · HIGH")).toBeInTheDocument();
});
