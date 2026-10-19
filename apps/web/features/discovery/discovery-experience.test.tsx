import { copy } from "@/lib/i18n";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithLocale as render } from "@/lib/test-render";
import { describe, expect, it, vi } from "vitest";
import { DiscoveryExperience } from "./discovery-experience";
import { LocaleProvider } from "@/lib/locale-context";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  usePathname: () => "/explore",
  useSearchParams: () => new URLSearchParams(),
}));

const emptyResult = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };

function renderDiscovery(input: { query?: string; initialError?: boolean; sort?: string } = {}) {
  return render(
    <DiscoveryExperience
      initial={emptyResult}
      initialError={input.initialError}
      categories={[]}
      platforms={[]}
      communities={[]}
      itemTypes={[]}
      initialFilters={{ q: input.query, sort: input.sort }}
    />,
  );
}

describe("DiscoveryExperience states", () => {
  it("offers Best match while searching, and only then", () => {
    const { unmount } = renderDiscovery({ query: "review", sort: "relevance" });
    const withSearch = screen.getByRole("combobox", { name: "Sort resources" });
    expect(withSearch).toHaveValue("relevance");
    expect(screen.getByRole("option", { name: "Best match" })).toBeInTheDocument();
    unmount();

    renderDiscovery({ sort: "featured" });
    expect(screen.queryByRole("option", { name: "Best match" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort resources" })).toHaveValue("featured");
  });

  it("falls back to Featured when a stale relevance sort has no search", () => {
    renderDiscovery({ sort: "relevance" });

    expect(screen.getByRole("combobox", { name: "Sort resources" })).toHaveValue("featured");
  });

  it("distinguishes an unavailable search from an empty result", () => {
    renderDiscovery({ initialError: true });

    expect(screen.getByRole("alert")).toHaveTextContent("Could not reach the community library");
    expect(screen.queryByText("No resources found")).not.toBeInTheDocument();
  });

  it("explains which query returned no published resources", () => {
    renderDiscovery({ query: "missing tool" });

    expect(screen.getByText("No resources found")).toBeInTheDocument();
    expect(screen.getByText(/missing tool/)).toBeInTheDocument();
  });

  it.each(["en", "fa"] as const)("labels declared access and updates the URL in %s", (locale) => {
    render(<LocaleProvider locale={locale} messages={copy[locale]}><DiscoveryExperience initial={emptyResult} categories={[]} platforms={[]} communities={[]} itemTypes={[]} initialFilters={{ permission: "network_access" }} /></LocaleProvider>);
    const select = screen.getByRole("combobox", { name: locale === "fa" ? "دسترسی اعلام‌شده" : "Declared access" });
    expect(select).toHaveValue("network_access");
    fireEvent.change(select, { target: { value: "filesystem_read" } });
    expect(replace).toHaveBeenCalledWith("/explore?permission=filesystem_read", { scroll: false });
    fireEvent.click(screen.getAllByRole("button", { name: locale === "fa" ? "پاک‌کردن همه" : "Clear all" })[0]);
    expect(replace).toHaveBeenLastCalledWith("/explore", { scroll: false });
  });

  it("keeps platform in the results bar, and sort in the drawer, so phones need no drawer to filter by platform", () => {
    render(
      <DiscoveryExperience
        initial={emptyResult}
        categories={[]}
        platforms={[{ key: "cursor", nameEn: "Cursor", nameFa: null }]}
        communities={[]}
        itemTypes={[]}
        initialFilters={{ platform: "cursor" }}
      />,
    );

    const bar = screen.getAllByRole("combobox", { name: "Platform" }).find((element) => element.hasAttribute("aria-label"));
    expect(bar).toHaveValue("cursor");
    expect(within(bar as HTMLElement).getByRole("option", { name: "Platform" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Filters/ })[0]);
    const drawer = screen.getByRole("dialog");
    expect(within(drawer).queryByText("Platform")).not.toBeInTheDocument();
    expect(within(drawer).getByText("Sort resources")).toBeInTheDocument();
    expect(within(drawer).getByText("Category")).toBeInTheDocument();
  });

  it("names a rate limit as one, not as a connection failure", () => {
    render(<DiscoveryExperience initial={emptyResult} initialError rateLimited categories={[]} platforms={[]} communities={[]} itemTypes={[]} initialFilters={{}} />);

    expect(screen.getByRole("alert")).toHaveTextContent("rate-limited");
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("shows each active filter as a chip that removes only itself", () => {
    replace.mockClear();
    render(
      <DiscoveryExperience initial={emptyResult} categories={[]} platforms={[]} communities={[]} itemTypes={[{ key: "skill", en: "Skills", fa: "مهارت‌ها", definition: "" }]} initialFilters={{ type: "skill", verified: true, minRating: 4.5 }} />,
    );

    const chips = screen.getAllByRole("button", { name: "Remove filter: Safety reviewed only" });
    expect(chips.length).toBeGreaterThan(0);
    fireEvent.click(chips[0]);
    expect(replace).toHaveBeenCalledWith("/explore", { scroll: false });
  });

  it("offers Clear all only when there is something to clear", () => {
    renderDiscovery({});
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
  });

  it("prints a search with replacement patterns literally, in its own direction", () => {
    renderDiscovery({ query: "$& and $1" });

    const shown = screen.getByText(/No published resources match/);
    expect(shown).toHaveTextContent("“$& and $1”");
    expect(within(shown).getByText("$& and $1").tagName).toBe("BDI");
  });

  it("counts one result in the singular", () => {
    render(<DiscoveryExperience initial={{ data: [], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } }} categories={[]} platforms={[]} communities={[]} itemTypes={[]} initialFilters={{}} />);

    expect(screen.getByRole("status")).toHaveTextContent(/^1 resource$/);
  });
});
