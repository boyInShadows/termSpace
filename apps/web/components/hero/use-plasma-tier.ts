"use client";

import { useSyncExternalStore } from "react";

/**
 * How much atmosphere this device gets behind the hero (docs/motion.md):
 *
 * - `static`: reduced motion, Save-Data, or reduced data. The CSS nebula,
 *   held still.
 * - `css`: phones, touch screens and low-end machines. The CSS nebula,
 *   drifting on the compositor. No WebGL code is ever downloaded.
 * - `webgl`: a wide screen, a fine pointer and a capable machine. The shader
 *   field, loaded once the browser is idle.
 */
export type PlasmaTier = "webgl" | "css" | "static";

const WEBGL_MIN_WIDTH = 1024;
const WEBGL_MIN_CORES = 4;
const WEBGL_MIN_MEMORY_GB = 4;

type DeviceSignals = {
  reducedMotion: boolean;
  saveData: boolean;
  reducedData: boolean;
  width: number;
  coarsePointer: boolean;
  /** navigator.hardwareConcurrency; undefined where the browser hides it. */
  cores?: number;
  /** navigator.deviceMemory in GB; Chromium only, undefined elsewhere. */
  memoryGb?: number;
};

/** Pure, so the thresholds are testable without a browser. */
export function plasmaTierFor(signals: DeviceSignals): PlasmaTier {
  if (signals.reducedMotion || signals.saveData || signals.reducedData) return "static";
  const lowEnd =
    (signals.cores !== undefined && signals.cores < WEBGL_MIN_CORES) ||
    (signals.memoryGb !== undefined && signals.memoryGb < WEBGL_MIN_MEMORY_GB);
  if (signals.width < WEBGL_MIN_WIDTH || signals.coarsePointer || lowEnd) return "css";
  return "webgl";
}

type NavigatorWithHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

function readSignals(): DeviceSignals {
  const nav = navigator as NavigatorWithHints;
  return {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    reducedData: window.matchMedia("(prefers-reduced-data: reduce)").matches,
    width: window.innerWidth,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    cores: nav.hardwareConcurrency || undefined,
    memoryGb: nav.deviceMemory,
  };
}

const WATCHED_QUERIES = ["(prefers-reduced-motion: reduce)", "(prefers-reduced-data: reduce)", "(pointer: coarse)"];

/** Re-decide when a preference or the window width changes. */
function subscribe(onChange: () => void) {
  const queries = WATCHED_QUERIES.map((query) => window.matchMedia(query));
  for (const query of queries) query.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/**
 * Null on the server and during hydration, so both render the CSS nebula;
 * the device is only asked once the page is interactive.
 */
export function usePlasmaTier(): PlasmaTier | null {
  return useSyncExternalStore(subscribe, () => plasmaTierFor(readSignals()), () => null);
}
