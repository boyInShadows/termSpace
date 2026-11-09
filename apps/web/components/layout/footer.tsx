import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { copy, footerLabels, localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";
import { legalLabels } from "@/lib/legal";
import { supportLabel } from "@/features/support/support-label";

export async function Footer() {
  const locale = await getLocale();
  const t = copy[locale];
  const labels = footerLabels[locale];
  const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL ?? "http://localhost:3001";
  const columns = [
    { heading: labels.marketplace, links: [
      { label: labels.explore, href: localePath("/explore", locale) },
      { label: labels.collections, href: localePath("/communities", locale) },
      { label: labels.newReleases, href: `${localePath("/explore", locale)}?sort=newest` },
    ] },
    { heading: labels.company, links: [
      { label: labels.journal, href: `${blogUrl.replace(/\/$/, "")}${locale === "fa" ? "/fa/blog" : "/blog"}` },
      { label: labels.support, href: localePath("/account", locale) },
      { label: supportLabel[locale], href: localePath("/support", locale) },
    ] },
    { heading: legalLabels[locale].legal, links: (["privacy", "terms", "content-policy"] as const).map((slug) => (
      { label: legalLabels[locale][slug], href: localePath(`/${slug}`, locale) }
    )) },
  ];
  return (
    <footer className="relative isolate mt-12 overflow-hidden border-t border-border bg-surface/40">
      {/* A last, quiet echo of the hero's plasma so the page closes on the
          same note it opened with. */}
      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo concept="pure" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {t.footer}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-verified/30 bg-verified/10 px-3 py-1.5 text-[11px] font-semibold text-verified">
            <ShieldCheck size={12} />
            {labels.permissions}
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="eyebrow">{column.heading}</h3>
            <ul className="mt-2 text-sm md:mt-4 md:space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="inline-block py-3 text-muted-foreground transition-colors hover:text-primary md:inline md:py-0"
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
        <p className="container-page font-mono text-xs text-muted-foreground">
          © 2026 termspace
        </p>
      </div>
    </footer>
  );
}
