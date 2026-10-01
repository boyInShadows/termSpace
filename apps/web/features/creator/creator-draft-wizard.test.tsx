import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-context";

const api = vi.hoisted(() => ({ options: vi.fn(), types: vi.fn(), create: vi.fn(), get: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/api", async (original) => ({ ...(await original<typeof import("@/lib/api")>()), getMarketplaceDraftOptions: api.options, getMarketplaceItemTypes: api.types, createCreatorDraft: api.create, getCreatorDraft: api.get, updateCreatorDraft: api.update }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const { CreatorDraftEditor } = await import("./creator-draft-editor");

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  api.options.mockResolvedValue({ categories: [{ slug: "tools", name: "Tools" }], communities: [], platforms: [], models: [] });
  api.types.mockResolvedValue([{ key: "skill", en: "Skill", fa: "مهارت" }]);
});

it("validates a step, keeps entered values while moving back, and restores progress", async () => {
  const view = render(<LocaleProvider locale="en"><CreatorDraftEditor /></LocaleProvider>);
  await screen.findByRole("heading", { name: "Listing identity" });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(document.querySelector('[data-step="0"]')).not.toHaveAttribute("hidden");
  fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "sample-skill" } });
  fireEvent.change(screen.getByLabelText(/Name \(English only\)/), { target: { value: "Sample Skill" } });
  fireEvent.change(screen.getByLabelText("English outcome"), { target: { value: "Helps review code" } });
  fireEvent.change(screen.getByLabelText(/English description/), { target: { value: "A useful review workflow." } });
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "tools" } });
  fireEvent.change(screen.getByLabelText(/Tags/), { target: { value: "review" } });
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(document.querySelector('[data-step="1"]')).not.toHaveAttribute("hidden");
  fireEvent.click(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getByLabelText("URL slug")).toHaveValue("sample-skill");
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  view.unmount();
  render(<LocaleProvider locale="en"><CreatorDraftEditor /></LocaleProvider>);
  await waitFor(() => expect(document.querySelector('[data-step="1"]')).not.toHaveAttribute("hidden"));
  expect(screen.getByLabelText("URL slug")).toHaveValue("sample-skill");
});
