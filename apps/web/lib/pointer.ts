/**
 * A single shared pointer store for the whole page.
 *
 * Every cursor-reactive surface (the WebGL plasma field and the 3D hero
 * scene) reads from here instead of attaching its own listener and its own rAF loop. One `pointermove` listener, one animation
 * frame, regardless of how many things are reacting.
 *
 * Values are normalised to -1..1 around the viewport centre and eased toward
 * the raw position so motion has weight instead of snapping. Nothing here
 * touches React state — consumers read `pointer` during their own frame and
 * write to the DOM directly, so cursor movement never triggers a re-render.
 */

export type PointerState = {
  /** Eased, normalised -1..1 from viewport centre. */
  x: number;
  y: number;
  /** Raw normalised 0..1 viewport coordinates. */
  clientX: number;
  clientY: number;
  /** False until the user actually moves a pointer, so we can hold a neutral pose. */
  isActive: boolean;
};

export const pointer: PointerState = {
  x: 0,
  y: 0,
  clientX: 0.5,
  clientY: 0.5,
  isActive: false,
};

const target = { x: 0, y: 0, clientX: 0.5, clientY: 0.5 };
const subscribers = new Set<() => void>();

const EASING = 0.085;
let frame = 0;
let listening = false;

function handleMove(event: PointerEvent) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  target.clientX = event.clientX / w;
  target.clientY = event.clientY / h;
  target.x = target.clientX * 2 - 1;
  target.y = target.clientY * 2 - 1;
  pointer.isActive = true;
}

function handleLeave() {
  target.x = 0;
  target.y = 0;
  target.clientX = 0.5;
  target.clientY = 0.5;
  pointer.isActive = false;
}

function tick() {
  pointer.x += (target.x - pointer.x) * EASING;
  pointer.y += (target.y - pointer.y) * EASING;
  pointer.clientX += (target.clientX - pointer.clientX) * EASING;
  pointer.clientY += (target.clientY - pointer.clientY) * EASING;

  for (const notify of subscribers) notify();

  frame = requestAnimationFrame(tick);
}

function start() {
  if (listening) return;
  listening = true;
  window.addEventListener("pointermove", handleMove, { passive: true });
  document.addEventListener("pointerleave", handleLeave);
  frame = requestAnimationFrame(tick);
}

function stop() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("pointermove", handleMove);
  document.removeEventListener("pointerleave", handleLeave);
  cancelAnimationFrame(frame);
}

/**
 * Register a per-frame callback. Returns an unsubscribe function; the shared
 * listener and rAF loop shut down once the last subscriber leaves.
 */
export function subscribePointer(onFrame: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  subscribers.add(onFrame);
  start();
  return () => {
    subscribers.delete(onFrame);
    if (subscribers.size === 0) stop();
  };
}
