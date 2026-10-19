import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { copy, footerLabels, localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/serverLocale";

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
    { heading: labels.create, links: [
      { label: labels.creatorGuide, href: localePath("/design-system", locale) },
      { label: labels.qualityStandards, href: localePath("/design-system", locale) },
    ] },
    { heading: labels.company, links: [
      { label: labels.about, href: localePath("/design-system", locale) },
      { label: labels.journal, href: `${blogUrl.replace(/\/$/, "")}${locale === "fa" ? "/fa/blog" : "/blog"}` },
      { label: labels.support, href: localePath("/account", locale) },
    ] },
  ];
  return (
    <footer className="mt-12 border-t border-foreground/60 bg-background">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo concept="pure" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {t.footer}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground">
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
