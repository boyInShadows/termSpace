// Browser-tab titles that are not already a label elsewhere. The root layout's
// template adds the site name.
export const titles = {
  en: {
    titles: {
      listingNotFound: "Listing not found",
      product: "{name} — {type}",
      productFor: "{name} — {type} for {platform}",
    },
  },
  fa: {
    titles: {
      listingNotFound: "منبع پیدا نشد",
      product: "{name} — {type}",
      productFor: "{name} — {type} برای {platform}",
    },
  },
} as const;
