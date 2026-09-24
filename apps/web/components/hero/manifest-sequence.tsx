"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import {
  COMMANDS,
  DONE_FRAME,
  MANIFEST_ROWS,
  frameAt,
  frameKey,
  type ManifestFrame,
} from "./manifest-timeline";

/** Delay after `load` before the sequence starts, so it never competes with LCP. */
const START_DELAY_MS = 600;
/** Share of the scene that must be on screen for the clock to run. */
const VISIBLE_RATIO = 0.5;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export type ManifestSequence = {
  frame: ManifestFrame;
  /** False on the server and under reduced motion: no controls are shown. */
  animated: boolean;
  paused: boolean;
  done: boolean;
  toggle: () => void;
  replay: () => void;
  hoverHandlers: { onPointerEnter: () => void; onPointerLeave: () => void };
};

/**
 * One requestAnimationFrame clock that advances only while playing, plays
 * once per page load, and never loops. It holds while the pointer is over
 * the card, while less than half the scene is on screen, while the tab is
 * hidden, and while the visitor has paused it.
 *
 * Reduced motion is read in an effect, not during render, so the server and
 * the hydrating client agree on the idle frame; the stylesheet shows the
 * finished frame to reduced-motion visitors before any script runs.
 */
export function useManifestSequence(
  sceneRef: RefObject<HTMLElement | null>,
): ManifestSequence {
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [frame, setFrame] = useState(() => frameAt(0));
  const [started, setStarted] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [offscreen, setOffscreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);
  const elapsed = useRef(0);
  const lastKey = useRef(frameKey(frame));

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced !== false) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => setStarted(true), START_DELAY_MS);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", schedule);
    };
  }, [reduced]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || reduced !== false) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOffscreen(entry.intersectionRatio < VISIBLE_RATIO),
      { threshold: [0, VISIBLE_RATIO, 1] },
    );
    observer.observe(scene);
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sceneRef, reduced]);

  const done = frame.phase === "done";
  const playing =
    reduced === false &&
    started &&
    !done &&
    !userPaused &&
    !hovered &&
    !offscreen &&
    !tabHidden;

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let id = 0;
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const next = frameAt(elapsed.current);
      const key = frameKey(next);
      if (key !== lastKey.current) {
        lastKey.current = key;
        setFrame(next);
      }
      if (next.phase !== "done") id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);

  const toggle = useCallback(() => setUserPaused((value) => !value), []);
  const replay = useCallback(() => {
    elapsed.current = 0;
    const first = frameAt(0);
    lastKey.current = frameKey(first);
    setFrame(first);
    setUserPaused(false);
    setStarted(true);
  }, []);
  const hoverHandlers = {
    onPointerEnter: useCallback(() => setHovered(true), []),
    onPointerLeave: useCallback(() => setHovered(false), []),
  };

  return {
    frame: reduced ? DONE_FRAME : frame,
    animated: reduced === false,
    paused: userPaused,
    done,
    toggle,
    replay,
    hoverHandlers,
  };
}

/* --- the card ------------------------------------------------------------ */

type Command = keyof typeof COMMANDS;

function CommandLine({
  command,
  frame,
  dim = false,
}: {
  command: Command;
  frame: ManifestFrame;
  dim?: boolean;
}) {
  return (
    <p
      className="h-6 overflow-hidden whitespace-nowrap text-muted-foreground"
      data-dim={dim ? "" : undefined}
    >
      <span className="text-accent">$</span>{" "}
      <span
        className="relative inline-block align-top"
        style={{ "--typed": frame.typed[command] } as CSSProperties}
      >
        <span className="ts-typed text-foreground">{COMMANDS[command]}</span>
        {frame.caret === command && (
          <span aria-hidden className="ts-seq-caret" />
        )}
      </span>
    </p>
  );
}

/**
 * The terminal card. Every line is always laid out at its final height and
 * only revealed, so the card, and the chips pinned to its corners, never
 * move while it plays.
 */
export function ManifestCard({
  frame,
  className,
  ...hover
}: { frame: ManifestFrame; className?: string } & Partial<
  ManifestSequence["hoverHandlers"]
>) {
  const { locale, t } = useLocale();
  return (
    <div
      dir="ltr"
      className={cn(
        "ts-seq panel overflow-hidden rounded-2xl shadow-lift",
        className,
      )}
      {...hover}
    >
      <div className="flex items-center gap-2 border-b border-border/80 bg-surface-raised/60 px-4 py-2.5">
        <span className="size-2 rounded-full bg-destructive/70" />
        <span className="size-2 rounded-full bg-warning/70" />
        <span className="size-2 rounded-full bg-verified/70" />
        {/* The one translated line. The mono face has no Persian glyphs, so a
            fallback would break the joins; Persian gets Estedad instead. */}
        <span
          lang={locale}
          className={cn(
            "ms-2 text-[11px] text-muted-foreground",
            locale === "fa" ? "font-[family-name:var(--font-estedad)]" : "font-mono",
          )}
        >
          {t.homePage.manifestTitle}
        </span>
      </div>

      <div className="px-4 pb-6 pt-3 font-mono text-[11.5px] leading-6 sm:text-xs">
        <CommandLine command="search" frame={frame} dim={frame.result} />
        <p
          className="ts-seq-line h-6 overflow-hidden whitespace-nowrap"
          data-on={frame.result}
        >
          <span className="text-primary">→</span>{" "}
          <span className="text-foreground">conversion-copywriter</span>
          <span className="text-muted-foreground"> Skill · v2.4.0 ★ 4.9</span>
        </p>

        <CommandLine command="inspect" frame={frame} />
        <div className="mt-1">
          {MANIFEST_ROWS.map(([key, value], index) => (
            <div
              key={key}
              className="ts-seq-row flex h-6 gap-3"
              data-on={index < frame.rows}
            >
              <span className="w-24 shrink-0 text-muted-foreground">{key}</span>
              <span className="min-w-0 flex-1 truncate text-foreground/90">
                {value}
              </span>
            </div>
          ))}
        </div>
        <p
          className="ts-seq-line flex h-6 items-center gap-1.5 overflow-hidden whitespace-nowrap text-verified"
          data-on={frame.verified}
        >
          <ShieldCheck size={13} className="shrink-0" />
          <span className="truncate">all declared surfaces accounted for</span>
        </p>

        <div className="mt-2 border-t border-border/70 pt-2">
          <CommandLine command="add" frame={frame} />
          <p
            className="ts-seq-line h-6 overflow-hidden whitespace-nowrap text-verified"
            data-on={frame.installed}
          >
            ✓ installed · pinned to v2.4.0
          </p>
        </div>
      </div>
    </div>
  );
}

/* --- controls ------------------------------------------------------------ */

/**
 * Outside the decorative, aria-hidden scene so they are real, reachable
 * buttons. The pause toggle shows on hover or focus (always on touch);
 * Replay stays once the run has finished.
 */
export function SequenceControls({ sequence }: { sequence: ManifestSequence }) {
  const { t } = useLocale();
  if (!sequence.animated) return null;
  const control =
    "inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground";
  return (
    <div className="mt-3 flex items-center justify-between px-[6%]">
      {sequence.done ? (
        <span />
      ) : (
        <button
          type="button"
          onClick={sequence.toggle}
          aria-pressed={sequence.paused}
          className={cn(
            control,
            "opacity-0 focus-visible:opacity-100 group-hover/scene:opacity-100 [@media(hover:none)]:opacity-100",
          )}
        >
          {sequence.paused ? <Play size={11} /> : <Pause size={11} />}
          {t.homePage.manifestPause}
        </button>
      )}
      {sequence.done && (
        <button type="button" onClick={sequence.replay} className={control}>
          <RotateCcw size={11} />
          {t.homePage.manifestReplay}
        </button>
      )}
    </div>
  );
}
