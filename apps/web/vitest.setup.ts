import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * jsdom implements neither `matchMedia` nor `IntersectionObserver`, and every
 * motion primitive in this codebase reads both — so without these stubs none
 * of them can be rendered in a test at all.
 *
 * `prefersReducedMotion` defaults to true, matching the hook's own server
 * snapshot: the calm, static rendering is the one a test sees unless it opts
 * in to motion. That also means assertions describe what a reduced-motion user
 * actually gets, which is the rendering most worth protecting.
 */

declare global {
  var prefersReducedMotion: boolean;
}

globalThis.prefersReducedMotion = true;

window.matchMedia = ((query: string) => ({
  matches: query.includes("prefers-reduced-motion")
    ? globalThis.prefersReducedMotion
    : false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

/** Reports every observed element as visible on the next tick. */
class ImmediateIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

window.IntersectionObserver =
  ImmediateIntersectionObserver as unknown as typeof IntersectionObserver;

afterEach(() => {
  // `globals` is off, so Testing Library never registers its own auto-cleanup.
  // Without this, renders accumulate in the document across tests in a file and
  // single-element queries fail with "found multiple elements".
  cleanup();
  globalThis.prefersReducedMotion = true;
});
