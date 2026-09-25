"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/** How long the old page may stay frozen while the new one renders. */
const MORPH_WAIT_MS = 1_500;
const POLL_MS = 16;

/**
 * A link to a listing whose title travels from the card into the detail
 * page header.
 *
 * React's <ViewTransition> cannot pair these: the detail page is rendered
 * per request, and it commits after the navigation's transition has already
 * captured the old page, so the two halves never meet. This drives the View
 * Transitions API directly instead. It snapshots the card, navigates, and
 * lets the browser take the new snapshot once the detail header is in the
 * document, or after MORPH_WAIT_MS, whichever comes first. Browsers without
 * the API, and modified clicks, get a plain navigation.
 */
export function ListingLink({ href, listingId, className, children }: { href: string; listingId: string; className?: string; children: ReactNode }) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof document.startViewTransition !== "function") return;
    event.preventDefault();
    document.startViewTransition(() => navigateAndWait(() => router.push(href), listingId));
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

async function navigateAndWait(navigate: () => void, listingId: string) {
  navigate();
  // Polled with timers, not animation frames: rendering is paused while a
  // view transition waits for its update, so frames would never arrive.
  const deadline = Date.now() + MORPH_WAIT_MS;
  while (Date.now() < deadline) {
    if (document.querySelector(`h1[data-listing-header="${CSS.escape(listingId)}"]`)) return;
    await new Promise((resolve) => window.setTimeout(resolve, POLL_MS));
  }
}
