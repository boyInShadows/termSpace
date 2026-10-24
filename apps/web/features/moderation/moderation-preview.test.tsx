import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";

const getPreview = vi.hoisted(() => vi.fn());
const moderate = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ loading: false, marketplaceRoles: ["moderator"] as string[] }));
const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));

vi.mock("./moderation-api", async (importOriginal) => ({ ...await importOriginal<typeof import("./moderation-api")>(), getModerationPreview: getPreview, moderateListing: moderate }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => session }));
vi.mock("@/features/moderation/moderation-reviews", () => ({ ModerationReviews: () => null }));
vi.mock("next/navigation", () => ({ useSearchParams: () => navigation.params }));

const { ApiError } = await import("@/lib/api");
const { ModerationPreview } = await import("./moderation-preview");
const { LocaleProvider } = await import("@/lib/locale-context");

const permissions = [
  { capability: "secret_access", required: true, scope: ".env files", destinations: [], purpose: "Reads API keys" },
  { capability: "network_access", required: false, destinations: ["api.github.com"], purpose: "Deletes remote branches" },
];
const content = (extra: Record<string, unknown> = {}) => ({
  listing: { slug: "repo-janitor", name: { en: "Repo Janitor" } },
  release: {
    version: "1.0.0", source: { kind: "github_repository", repositoryUrl: "https://github.com/example/repo-janitor", commitSha: "b".repeat(40) },
    installation: { method: "manual", instructions: ["Copy the files"] }, requirements: { runtimes: [], accounts: [], operatingSystems: [], dependencies: [], environmentVariables: [] },
    compatibility: [{ platform: "claude-code", models: [] }], license: { identifier: "MIT" }, permissions, ...extra,
  },
  typeDetails: {},
});
const submitted = {
  id: "product-1", slug: "repo-janitor", name: "Repo Janitor", type: "Skill", typeKey: "skill", state: "submitted", version: 2, published: false,
  updatedAt: "2026-10-19T08:00:00.000Z", selfOwned: false, creator: { id: "c1", name: "Creator", handle: "creator" },
  proposedSnapshot: {
    id: "s1", revision: 1, schemaVersion: 1, digestSha256: "a".repeat(64), content: content(), createdAt: "2026-10-19T08:00:00.000Z", communityRequests: [],
    releaseManifest: { id: "r1", sourceKind: "GITHUB_REPOSITORY", sourceUrl: "https://github.com/example/repo-janitor", sourceRef: "b".repeat(40), sourcePath: null, providerIntegrityDigest: null, sourceResolvedAt: "2026-10-19T08:00:00.000Z", ownershipVerifiedAt: null, sourceCheckStatus: "PENDING", sourceCheckedAt: null, lastSourceErrorCode: null, publishedAt: null },
  },
  approvedSnapshot: null, auditTrail: [], auditTrailTruncated: false,
};

function renderPreview() {
  return render(<LocaleProvider locale="en" messages={copy.en}><ModerationPreview productId="product-1" /></LocaleProvider>);
}
const decision = () => screen.getByRole("complementary", { name: "Decision" });

describe("ModerationPreview", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    session.marketplaceRoles = ["moderator"];
    navigation.params = new URLSearchParams();
    getPreview.mockResolvedValue(submitted);
    moderate.mockResolvedValue({ id: "product-1", state: "rejected", version: 3, published: false, correlationId: "x" });
  });

  it("leads with what the submission touches, risky access first and flagged", async () => {
    renderPreview();
    const touches = await screen.findByRole("region", { name: "What it touches" });
    expect(within(touches).getAllByRole("listitem")[0]).toHaveTextContent("Access secrets");
    expect(within(touches).getAllByText("Needs a closer look").length).toBeGreaterThan(0);
    expect(within(touches).getByText("Reads API keys")).toBeInTheDocument();
    const order = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(order.indexOf("What it touches")).toBeLessThan(order.indexOf("Source and checks"));
  });

  it("shows the source and ownership checks as separate results", async () => {
    renderPreview();
    const source = await screen.findByRole("region", { name: "Source and checks" });
    expect(within(source).getByText("Source").nextElementSibling).toHaveTextContent("Resolved");
    expect(within(source).getByText("Ownership").nextElementSibling).toHaveTextContent("Pending");
  });

  it("preselects no decision and cannot be submitted until one is chosen", async () => {
    renderPreview();
    await screen.findByRole("region", { name: "What it touches" });
    for (const radio of within(decision()).getAllByRole("radio")) expect(radio).not.toBeChecked();
    expect(within(decision()).getByRole("button", { name: "Choose a decision first" })).toBeDisabled();
  });

  it("names the action on the button and asks for confirmation before recording a rejection", async () => {
    renderPreview();
    await screen.findByRole("region", { name: "What it touches" });
    fireEvent.click(within(decision()).getByRole("radio", { name: "Reject listing" }));
    fireEvent.change(within(decision()).getByLabelText(/Reason shown to the creator/), { target: { value: "Reads secrets without need." } });
    fireEvent.click(within(decision()).getByRole("button", { name: "Reject listing" }));

    const confirm = await screen.findByRole("group", { name: "Confirm: Reject listing" });
    expect(moderate).not.toHaveBeenCalled();
    expect(within(confirm).getByText(/Reads secrets without need\./)).toBeInTheDocument();

    fireEvent.click(within(confirm).getByRole("button", { name: "Reject listing" }));
    await waitFor(() => expect(moderate).toHaveBeenCalledWith("product-1", { action: "REJECT", expectedVersion: 2, publicReason: "Reads secrets without need." }));
    expect(await screen.findByRole("status")).toHaveTextContent("Recorded: Reject listing on Repo Janitor.");
  });

  it("shows the reason code exactly as it will be stored, and stores that", async () => {
    renderPreview();
    await screen.findByRole("region", { name: "What it touches" });
    fireEvent.click(within(decision()).getByRole("radio", { name: "Approve listing" }));
    fireEvent.change(within(decision()).getByLabelText(/Reason code/), { target: { value: " policy-4.2 / secrets " } });
    fireEvent.click(within(decision()).getByRole("button", { name: "Approve listing" }));

    const confirm = await screen.findByRole("group", { name: "Confirm: Approve listing" });
    expect(within(confirm).getByText("POLICY_4_2_SECRETS")).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "Approve listing" }));
    await waitFor(() => expect(moderate).toHaveBeenCalledWith("product-1", { action: "APPROVE", expectedVersion: 2, reasonCode: "POLICY_4_2_SECRETS" }));
  });

  it("will not offer a decision against a stale page when the refresh after saving fails", async () => {
    renderPreview();
    await screen.findByRole("region", { name: "What it touches" });
    getPreview.mockRejectedValueOnce(new ApiError(0, "NETWORK_ERROR", "Network down"));
    fireEvent.click(within(decision()).getByRole("radio", { name: "Approve listing" }));
    fireEvent.click(within(decision()).getByRole("button", { name: "Approve listing" }));
    fireEvent.click(within(await screen.findByRole("group", { name: "Confirm: Approve listing" })).getByRole("button", { name: "Approve listing" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Your decision was saved, but the page could not refresh");
    for (const radio of within(decision()).getAllByRole("radio")) expect(radio).toBeDisabled();

    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    for (const radio of within(decision()).getAllByRole("radio")) expect(radio).toBeEnabled();
  });

  it("restates the declared access when approving, and goes back without recording", async () => {
    renderPreview();
    await screen.findByRole("region", { name: "What it touches" });
    fireEvent.click(within(decision()).getByRole("radio", { name: "Approve listing" }));
    fireEvent.click(within(decision()).getByRole("button", { name: "Approve listing" }));

    const confirm = await screen.findByRole("group", { name: "Confirm: Approve listing" });
    expect(within(confirm).getByText("Declared access you are accepting:")).toBeInTheDocument();
    expect(within(confirm).getByText("Access secrets")).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "Go back" }));
    expect(screen.queryByRole("group", { name: /Confirm/ })).not.toBeInTheDocument();
    expect(moderate).not.toHaveBeenCalled();
  });

  it("blocks publishing until the source is resolved and ownership verified", async () => {
    getPreview.mockResolvedValue({ ...submitted, state: "approved" });
    renderPreview();
    await screen.findByRole("region", { name: "What it touches" });
    fireEvent.click(within(decision()).getByRole("radio", { name: "Publish listing" }));
    expect(within(decision()).getByRole("button", { name: "Publish listing" })).toBeDisabled();
    expect(within(decision()).getByRole("note")).toHaveTextContent("Publishing needs a resolved source and verified ownership.");
  });

  it("shows the live approved version, with its access, when nothing is pending", async () => {
    getPreview.mockResolvedValue({
      ...submitted, state: "published", published: true, proposedSnapshot: null,
      approvedSnapshot: { id: "s0", revision: 4, content: content(), createdAt: "2026-10-01T00:00:00.000Z" },
    });
    renderPreview();
    const touches = await screen.findByRole("region", { name: "What it touches" });
    expect(within(touches).getByText("Access secrets")).toBeInTheDocument();
    expect(screen.getByText("Nothing is pending. Showing the live approved revision 4.")).toBeInTheDocument();
  });

  it("marks what changed against the approved version, including newly declared access", async () => {
    getPreview.mockResolvedValue({
      ...submitted,
      approvedSnapshot: { id: "s0", revision: 1, content: content({ permissions: [permissions[1]] }), createdAt: "2026-10-01T00:00:00.000Z" },
    });
    renderPreview();
    const changes = await screen.findByRole("region", { name: "Changed since the approved version" });
    expect(within(changes).getByText("What it touches")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "What it touches" })).getByText("New")).toBeInTheDocument();
  });

  it("returns to the queue with the filters it was opened from, and ignores anything else", async () => {
    navigation.params = new URLSearchParams({ from: "state=approved&page=2&evil=1" });
    renderPreview();
    expect(await screen.findByRole("link", { name: "Back to queue" })).toHaveAttribute("href", "/dashboard/moderation?state=approved&page=2");
  });

  it("shows screenshot addresses as text, never as links", async () => {
    getPreview.mockResolvedValue({ ...submitted, proposedSnapshot: { ...submitted.proposedSnapshot, content: { ...content(), listing: { screenshots: [{ url: "https://example.com/shot.png", alt: { en: "A shot" } }] } } } });
    renderPreview();
    expect(await screen.findByText("https://example.com/shot.png")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /example\.com/ })).not.toBeInTheDocument();
  });

  it("does not load anything without a staff marketplace role", () => {
    session.marketplaceRoles = ["creator"];
    renderPreview();
    expect(screen.getByRole("alert")).toHaveTextContent("An active community moderator or administrator role is required.");
    expect(getPreview).not.toHaveBeenCalled();
  });
});
