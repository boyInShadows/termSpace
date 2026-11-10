import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), replace: vi.fn(), refresh: vi.fn(), locale: "en" as "en" | "fa" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }) }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ locale: mocks.locale }) }));
vi.mock("@/lib/onboarding-api", async (original) => ({ ...await original<typeof import("@/lib/onboarding-api")>(), getOnboarding: mocks.get, saveOnboarding: mocks.save }));
vi.mock("@/features/account/marketplace-session", () => ({ useMarketplaceSession: () => ({ email: "member@example.test", identityLoading: false }) }));
const { AccountOnboarding } = await import("@/features/account/account-onboarding");
const { onboardingCopy } = await import("@/features/account/onboarding-copy");
const empty = { required: true, role: null, goal: null, tools: [], intent: null };
const complete = { required: false, role: "developer", goal: "discover", tools: ["codex"], intent: "explore" };

describe("account onboarding and profile editing", () => {
  afterEach(cleanup);
  beforeEach(() => { vi.clearAllMocks(); mocks.locale = "en"; mocks.get.mockResolvedValue(empty); mocks.save.mockResolvedValue(complete); });

  async function reachLastQuestion() {
    fireEvent.click(await screen.findByLabelText("Developer"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByLabelText("Discover useful tools"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByLabelText("Codex"));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  }

  it.each([["Explore tools and skills", "/explore", "explore"], ["Create and publish skills", "/dashboard/studio", "create"]])("saves before sending %s to %s", async (label, path, intent) => {
    render(<AccountOnboarding setup />);
    await reachLastQuestion();
    fireEvent.click(screen.getByLabelText(label));
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: intent === "create" ? "Open Studio" : "Explore tools" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(path));
    expect(mocks.save).toHaveBeenCalledWith({ role: "developer", goal: "discover", tools: ["codex"], intent });
  });

  it("validates each question and keeps answers after a failed save and back navigation", async () => {
    mocks.save.mockRejectedValueOnce(new TypeError("offline")).mockResolvedValueOnce(complete);
    render(<AccountOnboarding setup />);
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose an answer");
    await reachLastQuestion();
    fireEvent.click(screen.getByLabelText("Explore tools and skills"));
    fireEvent.click(screen.getByRole("button", { name: "Explore tools" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach");
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Codex")).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Explore tools" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/explore"));
  });

  it("lets every member edit the same answers in Profile without redirecting", async () => {
    mocks.get.mockResolvedValue(complete);
    render(<AccountOnboarding />);
    expect(await screen.findByLabelText("Developer")).toBeChecked();
    fireEvent.click(screen.getByLabelText("Cursor"));
    fireEvent.click(screen.getByLabelText("Create and publish skills"));
    fireEvent.click(screen.getByRole("button", { name: "Save profile details" }));
    await screen.findByText("Your profile details have been saved.");
    expect(mocks.save).toHaveBeenCalledWith({ role: "developer", goal: "discover", tools: ["codex", "cursor"], intent: "create" });
    expect(mocks.replace).not.toHaveBeenCalled();
    // The dashboard sidebar already links to Explore and the studio.
    expect(screen.queryByRole("link", { name: "Open Studio" })).not.toBeInTheDocument();
  });

  it("keeps Just getting started exclusive from actual tools", async () => {
    render(<AccountOnboarding />);
    fireEvent.click(await screen.findByLabelText("Codex"));
    fireEvent.click(screen.getByLabelText("Just getting started"));
    expect(screen.getByLabelText("Codex")).not.toBeChecked();
    fireEvent.click(screen.getByLabelText("Cursor"));
    expect(screen.getByLabelText("Just getting started")).not.toBeChecked();
  });

  it("retries a load failure and uses the saved destination for a completed setup", async () => {
    mocks.locale = "fa";
    mocks.get.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ ...complete, intent: "create" });
    render(<AccountOnboarding setup />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: onboardingCopy.fa.retry }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/fa/dashboard/studio"));
  });

  it("keeps both languages' answer keys identical", () => {
    for (const group of ["roles", "goals", "tools", "intents"] as const) {
      expect(Object.keys(onboardingCopy.en[group])).toEqual(Object.keys(onboardingCopy.fa[group]));
    }
  });
});
