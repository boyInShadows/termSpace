"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { useLocale } from "@/lib/locale-context";
import { footerLabels, localePath } from "@/lib/i18n";

export function Footer() {
  const { locale, t } = useLocale();
  const labels = footerLabels[locale];
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL ?? "http://localhost:3001";
  const columns = [
    { heading: labels.marketplace, links: [
      { label: labels.explore, href: localePath("/explore", locale) },
      { label: labels.collections, href: localePath("/#collections", locale) },
      { label: labels.newReleases, href: `${localePath("/explore", locale)}?sort=newest` },
    ] },
    { heading: labels.create, links: [
      { label: labels.creatorGuide, href: localePath("/#creators", locale) },
      { label: labels.qualityStandards, href: localePath("/design-system", locale) },
    ] },
    { heading: labels.company, links: [
      { label: labels.about, href: localePath("/design-system", locale) },
      { label: labels.journal, href: `${blogUrl.replace(/\/$/, "")}${locale === "fa" ? "/fa/blog" : "/blog"}` },
      { label: labels.support, href: localePath("/account", locale) },
    ] },
  ];
  return (
    <footer className="relative isolate mt-24 overflow-hidden border-t border-border bg-surface/40">
      {/* A last, quiet echo of the hero's plasma so the page closes on the
          same note it opened with. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-64 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(50% 100% at 20% 0%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%), radial-gradient(45% 100% at 82% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 72%)",
        }}
      />

      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo concept="pure" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {t.footer}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-verified/30 bg-verified/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-verified">
            <ShieldCheck size={12} />
            {labels.permissions}
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="eyebrow">{column.heading}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 py-5">
        <p className="container-page font-mono text-[11px] text-muted-foreground">
          © 2026 termspace · Concept prototype · Local mock data only
        </p>
      </div>
    </footer>
  );
}
