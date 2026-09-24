/**
 * The view-transition-name a listing's title carries on its card and on its
 * detail header (components/catalog/listing-link.tsx). Shared by server and
 * client components, so it lives outside the client module.
 */
export function listingTransitionName(id: string) {
  return `listing-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
