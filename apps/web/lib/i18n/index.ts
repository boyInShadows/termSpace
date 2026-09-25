/**
 * Every string the web app shows, per locale, assembled from one file per
 * surface so two people editing different surfaces do not edit the same
 * file. Add a string to the file for its surface; add a surface as a new
 * file and spread it here. Both locales must carry the same keys.
 */
import { common } from "./common";
import { dashboard } from "./dashboard";
import { catalog } from "./catalog";
import { creator } from "./creator";
import { moderation } from "./moderation";
import { home } from "./home";

export { footerLabels, localePath, type Locale } from "./common";

export const copy = {
  en: {
    ...common.en,
    ...dashboard.en,
    ...catalog.en,
    ...creator.en,
    ...moderation.en,
    ...home.en,
  },
  fa: {
    ...common.fa,
    ...dashboard.fa,
    ...catalog.fa,
    ...creator.fa,
    ...moderation.fa,
    ...home.fa,
  },
} as const;
