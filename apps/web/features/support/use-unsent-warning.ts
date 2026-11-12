"use client";
import { useEffect, useRef } from "react";

export function useUnsentWarning(dirty: boolean, message: string) {
  const dirtyRef = useRef(dirty);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault(); event.returnValue = "";
    };
    const click = (event: MouseEvent) => {
      if (!dirtyRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.href === window.location.href || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm(message)) { event.preventDefault(); event.stopPropagation(); }
    };
    const traverse = (event: Event) => {
      if (dirtyRef.current && (event as Event & { navigationType?: string }).navigationType === "traverse" && event.cancelable && !window.confirm(message)) event.preventDefault();
    };
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    navigation?.addEventListener("navigate", traverse);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
      navigation?.removeEventListener("navigate", traverse);
    };
  }, [message]);
  return () => { dirtyRef.current = false; };
}
