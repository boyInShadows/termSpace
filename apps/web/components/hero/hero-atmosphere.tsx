"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePlasmaTier } from "./use-plasma-tier";

/**
 * Its own chunk, fetched only on the WebGL tier, so phones never download
 * the shader code at all.
 */
const PlasmaField = dynamic(() => import("./plasma-field").then((module) => module.PlasmaField), {
  ssr: false,
});

/** Wait no longer than this for the browser to go idle. */
const IDLE_TIMEOUT_MS = 2_000;

/**
 * The hero's background. The CSS nebula is always there: it is what the
 * server renders, what every phone shows, and what sits beneath the WebGL
 * field while that loads. On the WebGL tier the field is mounted once the
 * browser is idle (after LCP) and unmounted, which loses its GL context,
 * whenever the hero is off screen.
 */
export function HeroAtmosphere() {
  const tier = usePlasmaTier();
  const ref = useRef<HTMLDivElement | null>(null);
  const [idle, setIdle] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    if (tier !== "webgl") return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), IDLE_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [tier]);

  useEffect(() => {
    const node = ref.current;
    if (!node || tier !== "webgl") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [tier]);

  return (
    <div ref={ref} className="absolute inset-0" data-plasma-tier={tier ?? undefined}>
      <div aria-hidden className="ts-nebula" data-still={tier === "static" ? "" : undefined}>
        <div className="ts-nebula-swirl" />
      </div>
      {tier === "webgl" && idle && inView && <PlasmaField className="absolute inset-0" />}
    </div>
  );
}
