"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * One `localStorage` key, read the only way that is safe under concurrent
 * rendering and hydrates without a mismatch.
 *
 * The server snapshot is always `null`, so the server and the first client
 * render agree; React then swaps in whatever the browser actually had. Reading
 * `localStorage` during render instead would desynchronise hydration, and
 * reading it in an effect would mean a second render pass for every consumer.
 *
 * Every access is wrapped. In a private window, with site data blocked, or
 * during a thumbnail capture these throw, and nothing here is important enough
 * to break a page over — a forgotten preference is an acceptable outcome.
 *
 * The value is a string, so `useSyncExternalStore`'s identity check compares
 * by value and there is no snapshot to memoise.
 */

const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function serverSnapshot(): null {
  return null;
}

export function useStoredString(key: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const forKey = listeners.get(key) ?? new Set();
      forKey.add(onChange);
      listeners.set(key, forKey);
      // Another tab writing the same key should update this one too.
      window.addEventListener("storage", onChange);
      return () => {
        forKey.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    useCallback(() => read(key), [key]),
    serverSnapshot,
  );

  const write = useCallback(
    (next: string | null) => {
      try {
        if (next === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, next);
      } catch {
        // Not remembering is acceptable; failing to render is not.
      }
      notify(key);
    },
    [key],
  );

  return [value, write] as const;
}
