import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Browse } from "./browse";

const replace = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(search),
}));

const collections = [
  { title: "Careful research", copy: "Evidence first.", category: "Research", count: 84 },
  { title: "Ship software", copy: "Review tools.", category: "Engineering", count: null },
];
const categories = [
  { name: "Engineering", slug: "engineering" },
  { name: "Research", slug: "research" },
];

function setup() {
  return render(
    <Browse
      collections={collections}
      categories={categories}
      exploreHref="/explore"
    />,
  );
}

describe("Browse", () => {
  beforeEach(() => {
    search = "";
    replace.mockClear();
  });

  it("opens on collections and hides the practice panel", () => {
    setup();
    expect(screen.getByRole("tab", { name: "Collections" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { hidden: false })).toHaveAttribute(
      "id",
      "browse-panel-collections",
    );
  });

  it("omits the count when the catalogue has no such category", () => {
    setup();
    expect(screen.getByText("84 listings")).toBeInTheDocument();
    expect(screen.queryByText("null listings")).not.toBeInTheDocument();
    expect(screen.queryByText("0 listings")).not.toBeInTheDocument();
  });

  it("puts the selected tab in the URL without scrolling the page", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: "By practice" }));
    expect(replace).toHaveBeenCalledWith("/?browse=practice", {
      scroll: false,
    });
  });

  it("opens on the practice panel when the URL asks for it", () => {
    search = "browse=practice";
    setup();
    expect(screen.getByRole("tab", { name: "By practice" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { hidden: false })).toHaveAttribute(
      "id",
      "browse-panel-practice",
    );
  });

  it("moves between tabs with the arrow keys", async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();
    expect(screen.getByRole("tab", { name: "Collections" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(replace).toHaveBeenCalledWith("/?browse=practice", {
      scroll: false,
    });
  });
});
