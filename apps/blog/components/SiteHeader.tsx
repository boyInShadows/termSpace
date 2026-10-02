"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { localePath, type Locale } from "@/lib/i18n";
import {useLocale, useTranslations} from "next-intl";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const locale = useLocale() as Locale;
  const nav = useTranslations("Navigation");
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: nav("home") },
    { href: "/blog", label: nav("blog") },
    { href: "/blog/signals", label: "Signals" },
    { href: "/blog/dossiers", label: locale === "fa" ? "پرونده‌ها" : "Dossiers" },
    { href: "/editions", label: nav("editions") },
    { href: "/topics", label: nav("topics") },
    { href: "/resources", label: nav("resources") },
    { href: "/library", label: nav("library") },
  ];
  const localPath = locale === "fa" ? pathname.slice(3) || "/" : pathname;
  const switchHref = locale === "fa" ? localPath : localePath(pathname, "fa");
  const isActive = (href: string) => href === "/" || href === "/blog" ? localPath === href : localPath.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6">
        <div dir="ltr" className="grid h-16 grid-cols-[1fr_auto] items-center md:grid-cols-[1fr_auto_1fr]">
          <Link href={localePath("/", locale)} className="flex items-center gap-2 justify-self-start text-lg font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-paper">
              <span className="font-serif text-sm">T</span>
            </span>
            <span className="font-serif">Termspace</span>
          </Link>
          <nav dir={locale === "fa" ? "rtl" : "ltr"} className="hidden items-center justify-center gap-5 md:flex" aria-label="Primary">
            {links.map((link) => (
              <Link key={link.href} href={localePath(link.href, locale)} className={`text-sm transition-colors ${isActive(link.href) ? "font-medium text-accent" : "text-ink-soft hover:text-ink"}`}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div dir={locale === "fa" ? "rtl" : "ltr"} className="hidden items-center justify-self-end gap-3 md:flex">
            <a href={switchHref} hrefLang={locale === "fa" ? "en" : "fa"} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent">
              {nav("language")}
            </a>
            <Link href={localePath("/account", locale)} className={`text-sm transition-colors ${isActive("/account") ? "font-medium text-accent" : "text-ink-soft hover:text-ink"}`}>
              {nav("signIn")}
            </Link>
          </div>
          <button type="button" className="inline-flex justify-self-end rounded-md p-2 text-ink-soft hover:bg-paper-warm md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Toggle navigation menu" onClick={() => setOpen((value) => !value)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M6 12l12-6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" className="border-t border-line py-3 md:hidden" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.href} href={localePath(link.href, locale)} onClick={() => setOpen(false)} className={`block rounded-md px-3 py-2 text-sm ${isActive(link.href) ? "bg-accent-tint font-medium text-accent" : "text-ink-soft hover:bg-paper-warm"}`}>
                {link.label}
              </Link>
            ))}
            <Link href={localePath("/account", locale)} onClick={() => setOpen(false)} className={`block rounded-md px-3 py-2 text-sm ${isActive("/account") ? "bg-accent-tint font-medium text-accent" : "text-ink-soft hover:bg-paper-warm"}`}>
              {nav("signIn")}
            </Link>
            <a href={switchHref} hrefLang={locale === "fa" ? "en" : "fa"} className="mt-2 block rounded-md border border-line px-3 py-2 text-sm">
              {nav("language")}
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
