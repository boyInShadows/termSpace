import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { EditionManager } from "@/components/admin/EditionManager";
import { MediaManager } from "@/components/admin/MediaManager";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
const showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
const close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
beforeEach(() => {
  vi.stubGlobal("scrollTo", vi.fn());
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
});
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("opens a browser-modal confirmation and keeps a busy operation from being canceled", () => {
  const onCancel = vi.fn();
  const props = { open: true, title: "Delete edition?", description: "Articles remain.", confirmLabel: "Delete", onConfirm: vi.fn(), onCancel };
  const { rerender } = render(<ConfirmDialog {...props} busy />);
  const dialog = screen.getByRole("dialog", { name: "Delete edition?" });
  expect(showModal).toHaveBeenCalledOnce();
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(onCancel).not.toHaveBeenCalled();
  rerender(<ConfirmDialog {...props} />);
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(onCancel).toHaveBeenCalledOnce();
});

it("associates edition labels with their fields", () => {
  render(<EditionManager initialEditions={[]} articles={[]} />);
  expect(screen.getByLabelText("Title")).toHaveAttribute("required");
  expect(screen.getByLabelText("Accent color")).toHaveAttribute("type", "color");
});

it("names upload and taxonomy controls", () => {
  const { unmount } = render(<MediaManager initialAssets={[]} />);
  expect(screen.getByLabelText("Image file")).toHaveAttribute("type", "file");
  unmount();
  const resources = render(<ResourceManager initialResources={[]} />);
  expect(screen.getByLabelText("Title")).toHaveAttribute("required");
  resources.unmount();
  render(<TaxonomyManager initialTags={[]} initialSeries={[]} />);
  expect(screen.getByLabelText("Type")).toHaveValue("tag");
});

it("focuses an invalid article field and connects its explanation", () => {
  render(<ArticleForm authors={[]} categories={[]} tags={[]} series={[]} media={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Create article" }));
  const title = screen.getByLabelText("Title");
  expect(title).toHaveFocus();
  expect(title).toHaveAccessibleDescription("Title must be at least 3 characters.");
});
