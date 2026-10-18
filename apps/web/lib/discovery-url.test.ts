import { describe, expect, it } from "vitest";
import { discoveryHref, filtersFromParams, toSearchParams } from "./discovery-url";

describe("filtersFromParams", () => {
  it("fills defaults for an empty URL", () => {
    expect(filtersFromParams({})).toMatchObject({ sort: "featured", page: 1, limit: 12, verified: undefined, minRating: undefined });
  });

  it("reads every filter, taking the first of repeated params", () => {
    expect(
      filtersFromParams({ q: "review", type: ["agent", "skill"], platform: "cursor", verified: "true", minRating: "4.5", sort: "rating", page: "3" }),
    ).toMatchObject({ q: "review", type: "agent", platform: "cursor", verified: true, minRating: 4.5, sort: "rating", page: 3 });
  });

  it("orders a search by relevance unless a sort is chosen", () => {
    expect(filtersFromParams({ q: "review" }).sort).toBe("relevance");
    expect(filtersFromParams({ q: "review", sort: "rating" }).sort).toBe("rating");
    expect(filtersFromParams({ q: "   " }).sort).toBe("featured");
  });

  it("treats a bad page number as page 1", () => {
    expect(filtersFromParams({ page: "-2" }).page).toBe(1);
    expect(filtersFromParams({ page: "two" }).page).toBe(1);
    expect(filtersFromParams({ page: "1.5" }).page).toBe(1);
  });

  it("restores declared-access filters from shared URLs", () => {
    expect(filtersFromParams({ permission: ["network_access", "telemetry"] }).permission).toBe("network_access");
    expect(discoveryHref("/explore", "permission=network_access&page=3", { permission: "All" })).toBe("/explore");
    expect(discoveryHref("/explore", "permission=network_access", { page: 2 })).toBe("/explore?permission=network_access&page=2");
  });
});

describe("discoveryHref", () => {
  it("sets a filter and returns to page 1", () => {
    expect(discoveryHref("/explore", "type=skill&page=3", { platform: "cursor" })).toBe("/explore?type=skill&platform=cursor");
  });

  it("keeps the other filters when changing page", () => {
    expect(discoveryHref("/explore", "type=skill", { page: 2 })).toBe("/explore?type=skill&page=2");
  });

  it("leaves defaults out of the URL", () => {
    expect(discoveryHref("/explore", "type=skill&sort=rating&page=2", { type: "All", sort: "featured", page: 1 })).toBe("/explore");
    expect(discoveryHref("/explore", "", { verified: false, minRating: 0, q: "" })).toBe("/explore");
  });

  it("keeps the sort that is the default for the search at hand out of the URL", () => {
    expect(discoveryHref("/explore", "", { q: "review" })).toBe("/explore?q=review");
    expect(discoveryHref("/explore", "q=review", { sort: "relevance" })).toBe("/explore?q=review");
    expect(discoveryHref("/explore", "q=review", { sort: "rating" })).toBe("/explore?q=review&sort=rating");
  });

  it("keeps an explicit Featured while searching, since the default there is relevance", () => {
    expect(discoveryHref("/explore", "q=review", { sort: "featured" })).toBe("/explore?q=review&sort=featured");
  });

  it("drops a relevance sort once the search is cleared", () => {
    expect(discoveryHref("/explore", "q=review&sort=relevance", { q: "" })).toBe("/explore");
    expect(discoveryHref("/explore", "q=review&sort=featured", { q: "" })).toBe("/explore");
  });

  it("keeps the locale prefix of the path it is given", () => {
    expect(discoveryHref("/fa/explore", "", { sort: "rating" })).toBe("/fa/explore?sort=rating");
  });
});

describe("toSearchParams", () => {
  it("flattens the server's record form", () => {
    expect(toSearchParams({ type: ["agent", "skill"], q: "x", missing: undefined }).toString()).toBe("type=agent&q=x");
  });
});
