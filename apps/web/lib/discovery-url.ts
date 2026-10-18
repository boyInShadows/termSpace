import type { ProductFilters } from "./types";

/**
 * Explore's state lives in the URL (AGENTS.md: shareable view state goes in
 * search params). These helpers are the one reading of it, shared by the
 * server pages that fetch a page of results and the client controls that
 * change it, so both always agree on what a URL means.
 */

export const DISCOVERY_PAGE_SIZE = 12;
/** A search is ordered by how well it matches; browsing is ordered by featured. */
const defaultSort = (query: string | null | undefined) => (query?.trim() ? "relevance" : "featured");

export type RawSearchParams = Record<string, string | string[] | undefined>;
type ParamValue = string | number | boolean | null | undefined;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function positiveInt(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

/** The filters a URL asks for, with defaults filled in. */
export function filtersFromParams(raw: RawSearchParams): ProductFilters {
  const minRating = Number(first(raw.minRating));
  return {
    q: first(raw.q),
    type: first(raw.type),
    category: first(raw.category),
    community: first(raw.community),
    platform: first(raw.platform),
    permission: first(raw.permission),
    verified: first(raw.verified) === "true" || undefined,
    minRating: Number.isFinite(minRating) && minRating > 0 ? minRating : undefined,
    sort: first(raw.sort) ?? defaultSort(first(raw.q)),
    page: positiveInt(first(raw.page)),
    limit: DISCOVERY_PAGE_SIZE,
  };
}

/** A default value is left out of the URL, so equal views share one URL. */
function isDefault(key: string, value: ParamValue): boolean {
  if (value === undefined || value === null || value === "" || value === false || value === "All") return true;
  if (key === "page") return Number(value) <= 1;
  if (key === "minRating") return Number(value) <= 0;
  return false;
}

/**
 * The URL for `pathname` after applying `changes` to `current`. Any change
 * other than the page itself returns to page 1, since page 3 of different
 * filters is a different page.
 */
export function discoveryHref(pathname: string, current: URLSearchParams | string, changes: Record<string, ParamValue>): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (isDefault(key, value)) params.delete(key);
    else params.set(key, String(value));
  }
  if (!("page" in changes)) params.delete("page");
  // Whether a sort is the default depends on the search text, so decide it last.
  const sort = params.get("sort");
  if (sort === defaultSort(params.get("q")) || (sort === "relevance" && !params.get("q")?.trim())) params.delete("sort");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Search params from the server's record form, for building hrefs there. */
export function toSearchParams(raw: RawSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const single = first(value);
    if (single !== undefined) params.set(key, single);
  }
  return params;
}
