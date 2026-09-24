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

  it("treats a bad page number as page 1", () => {
    expect(filtersFromParams({ page: "-2" }).page).toBe(1);
    expect(filtersFromParams({ page: "two" }).page).toBe(1);
    expect(filtersFromParams({ page: "1.5" }).page).toBe(1);
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

  it("keeps the locale prefix of the path it is given", () => {
    expect(discoveryHref("/fa/explore", "", { sort: "rating" })).toBe("/fa/explore?sort=rating");
  });
});

describe("toSearchParams", () => {
  it("flattens the server's record form", () => {
    expect(toSearchParams({ type: ["agent", "skill"], q: "x", missing: undefined }).toString()).toBe("type=agent&q=x");
  });
});
