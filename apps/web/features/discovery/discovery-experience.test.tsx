import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiscoveryExperience } from "./discovery-experience";

const emptyResult = { data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };

function renderDiscovery(input: { query?: string; initialError?: boolean } = {}) {
  return render(
    <DiscoveryExperience
      initial={emptyResult}
      initialError={input.initialError}
      categories={[]}
      platforms={[]}
      communities={[]}
      itemTypes={[]}
      initialFilters={{ q: input.query }}
    />,
  );
}

describe("DiscoveryExperience states", () => {
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
