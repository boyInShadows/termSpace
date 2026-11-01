"use client";

import { useEffect, useRef } from "react";
import { recordListingView } from "@/lib/api";

/**
 * Sends one view beacon per mount of a published listing page. The request
 * carries no identifier, and a visitor who asked not to be tracked is not
 * counted at all. Failures are ignored: a view is telemetry, never something
 * the page depends on. Prefetches never mount this, so they cannot inflate it.
 */
export function ListingViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const navigatorWithGpc = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (navigator.doNotTrack === "1" || navigatorWithGpc.globalPrivacyControl === true) return;
    void recordListingView(slug).catch(() => {});
  }, [slug]);

  return null;
}
