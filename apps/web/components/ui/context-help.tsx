"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import { useLocale } from "@/lib/locale-context";
import type { HelpMessage, HelpTopic } from "./context-help-copy";

export function ContextHelp({ label, topic }: { label: string; topic: HelpTopic }) {
  const { locale } = useLocale();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pinned = useRef(false);
  const touchFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<HelpMessage | null>(null);
  function cancelClose() { clearTimeout(timer.current); }
  function close() { cancelClose(); pinned.current = false; setOpen(false); }
  function leave() {
    cancelClose();
    timer.current = setTimeout(() => {
      if (!pinned.current && document.activeElement !== trigger.current) setOpen(false);
    }, 150);
  }

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    let active = true;
    void import("./context-help-copy").then(({ helpCopy }) => {
      if (active) setMessage(helpCopy[locale][topic]);
    }).catch(() => {
      if (active) setMessage({ body: locale === "fa" ? "راهنما بارگذاری نشد. آن را ببندید و دوباره باز کنید." : "Help could not load. Close and reopen it to retry.", example: "" });
    });
    return () => { active = false; };
  }, [open, locale, topic]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!trigger.current?.contains(event.target as Node) && !bubble.current?.contains(event.target as Node)) close();
    }
    function escape(event: KeyboardEvent) { if (event.key === "Escape" || event.key === "Tab") close(); }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      const button = trigger.current;
      const panel = bubble.current;
      if (!button || !panel) return;
      const box = button.getBoundingClientRect();
      const anchor = button.closest("[data-help-anchor]")?.getBoundingClientRect() ?? box;
      const width = panel.offsetWidth;
      const start = locale === "fa" ? box.left : box.right - width;
      panel.style.left = `${Math.max(8, Math.min(start, window.innerWidth - width - 8))}px`;
      const above = anchor.top - 16;
      const below = window.innerHeight - anchor.bottom - 16;
      const placeAbove = above >= panel.scrollHeight || above >= below;
      panel.style.maxHeight = `${Math.max(48, placeAbove ? above : below)}px`;
      const height = panel.offsetHeight;
      const top = placeAbove ? anchor.top - height - 8 : anchor.bottom + 8;
      panel.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
    }
    position();
    const observer = new ResizeObserver(position);
    if (bubble.current) observer.observe(bubble.current);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, locale]);

  return <>
    <button ref={trigger} type="button" aria-label={`${locale === "fa" ? "راهنما" : "Help"}: ${label}`} aria-describedby={open ? id : undefined}
      className="inline-flex size-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onPointerEnter={(event) => { cancelClose(); if (event.pointerType === "mouse") setOpen(true); }} onPointerLeave={leave}
      onPointerDown={(event) => { touchFocus.current = event.pointerType !== "mouse"; }}
      onFocus={() => { cancelClose(); if (!touchFocus.current) setOpen(true); }} onBlur={() => { touchFocus.current = false; if (!pinned.current) leave(); }}
      onClick={() => { cancelClose(); pinned.current = !pinned.current; setOpen(pinned.current); }}>
      <CircleHelp className="size-4" aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={bubble} id={id} role="tooltip" aria-live="polite" aria-atomic="true" dir={locale === "fa" ? "rtl" : "ltr"}
      className="fixed z-[80] max-h-[calc(100dvh-1rem)] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto border border-border-strong bg-surface p-4 text-start text-sm font-normal leading-6 text-foreground [overflow-wrap:anywhere]"
      onPointerEnter={cancelClose} onPointerLeave={leave}>
      <p>{message?.body ?? (locale === "fa" ? "در حال بارگذاری راهنما…" : "Loading help…")}</p>
      {message?.example && <p className="mt-2 text-muted-foreground">{locale === "fa" ? "مثال: " : "Example: "}<bdi dir="auto">{message.example}</bdi></p>}
    </div>, document.body)}
  </>;
}
