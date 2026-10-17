"use client";

import type { Locale } from "@/lib/i18n";
import { ReleaseProvenance } from "./release-provenance";
import type { ReleaseState } from "./release-selection";

/** What the provenance section shows while a release other than the page's own is selected. */
export function OtherRelease({ state, selected, latest, slug, locale }: { state: ReleaseState; selected: string; latest: string | undefined; slug: string; locale: Locale }) {
  const fa = locale === "fa";
  if (state.status === "ready") {
    return (
      <div>
        <p className="mb-5 text-sm text-foreground">
          {fa ? "نسخهٔ " : "Showing the "}<bdi dir="ltr" className="font-mono">v{selected}</bdi>{fa ? " نمایش داده می‌شود، نه جدیدترین (" : " release, not the latest ("}<bdi dir="ltr" className="font-mono">v{latest}</bdi>).
        </p>
        <ReleaseProvenance release={state.release} slug={slug} locale={locale} />
      </div>
    );
  }
  return (
    <p role={state.status === "error" ? "alert" : "status"} className="text-sm text-foreground">
      {state.status === "error"
        ? fa ? "این نسخه بارگذاری نشد. آن را دوباره از فهرست انتخاب کنید." : "Couldn’t load this release. Pick it again to retry."
        : fa ? "در حال بارگذاری این نسخه…" : "Loading this release…"}
    </p>
  );
}
