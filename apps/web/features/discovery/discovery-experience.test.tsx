import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DiscoveryExperience } from "./discovery-experience";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
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
});
