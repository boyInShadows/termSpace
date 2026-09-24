"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, ArrowRight, Globe } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "../ui/theme-toggle";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { useStoredString } from "@/lib/hooks/use-stored-string";
import { localePath } from "@/lib/i18n";

/**
 * The header does two things beyond navigation.
 *
 * It condenses once you leave the hero — the announcement strip retracts and
 * the bar tightens — so the page gives its vertical space back to content as
 * soon as you have committed to reading.
 *
 * And it carries a plasma read-out of how far through the page you are.
 * Progress is written straight to a CSS custom property from a scroll
 * listener; routing the highest-frequency input on the page through React
 * state would make every frame a reconciliation.
 */

const ANNOUNCEMENT_KEY = "termspace:announcement-dismissed";

/**
 * Bump when the announcement changes. Dismissal is stored against this, so a
 * new announcement is shown again to someone who dismissed the previous one
 * rather than being silently suppressed forever.
 */
const ANNOUNCEMENT_ID = "verified-mcp-servers";

export function Header() {
  const { locale, t } = useLocale();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const currentPath = locale === "fa" ? pathname.slice(3) || "/" : pathname;
  const query = searchParams.toString();
  const switchHref = `${locale === "fa" ? currentPath : localePath(currentPath, "fa")}${query ? `?${query}` : ""}`;
  const session = useMarketplaceSession();
  const canModerate =
    session.marketplaceRoles.includes("moderator") ||
    session.marketplaceRoles.includes("administrator");
  const NAV = [
    { href: "/explore", label: t.explore },
    { href: "/design-system", label: t.designSystem },
    { href: "/creator", label: t.shareWork },
    ...(canModerate ? [{ href: "/moderation", label: t.moderation.nav }] : []),
    ...(session.email ? [{ href: "/dashboard", label: t.dashboard }] : []),
  ];
  const [isCondensed, setIsCondensed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dismissed, setDismissed] = useStoredString(ANNOUNCEMENT_KEY);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const isAnnouncementVisible = dismissed !== ANNOUNCEMENT_ID;

  // `/explore` should not light up while you are on `/explore/something`'s
  // sibling routes, but `/` must not match everything.
  const isCurrent = (href: string) =>
    href === "/" ? currentPath === "/" : currentPath.startsWith(href);

  useEffect(() => {
    let queued = false;
    let frame = 0;

    const measure = () => {
      queued = false;
      const scrolled = window.scrollY;
      const scrollable = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      progressRef.current?.style.setProperty(
        "--scrolled",
        (scrolled / scrollable).toFixed(4),
      );
      setIsCondensed(scrolled > 80);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    /* One landmark. The announcement strip and the mobile menu used to sit
       outside <header> as siblings, which left banner content in no landmark
       at all. The bar inside stays sticky; the wrapper does not need to be. */
    <header>
      {/* --- announcement strip, retracts on scroll, dismissible ---------- */}
      {isAnnouncementVisible && (
        <div
          className={cn(
            "overflow-hidden border-b border-border/60 bg-surface/60 backdrop-blur transition-[height,opacity] duration-500",
            isCondensed ? "h-0 opacity-0" : "h-9 opacity-100",
          )}
        >
          <div className="container-page flex h-9 items-center gap-2">
            <p className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center text-xs">
              <span className="size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="truncate text-muted-foreground">
                {t.announcement}
              </span>
              <Link
                href={localePath("/explore", locale)}
                className="group inline-flex shrink-0 items-center gap-1 font-semibold text-primary"
              >
                {t.explore}
                <ArrowRight
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setDismissed(ANNOUNCEMENT_ID)}
              aria-label={t.homePage.dismissAnnouncement}
              className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={13} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div
          className={cn(
            "container-page flex items-center justify-between transition-[height] duration-500",
            isCondensed ? "h-14" : "h-16",
          )}
        >
          <Logo />

          <nav
            className="hidden items-center gap-8 text-sm md:flex"
            aria-label={t.primary}
          >
            {NAV.map((item) => {
              const current = isCurrent(item.href);
              return (
                <Link
                  key={item.href}
                  href={localePath(item.href, locale)}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "group relative py-1 transition-colors hover:text-primary",
                    current && "font-semibold text-primary",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "rule-plasma absolute inset-x-0 -bottom-0.5 h-px origin-left transition-transform duration-300",
                      // The current route keeps its underline; the others grow
                      // one on hover.
                      current ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {/* A real button, not 11px of low-contrast text pushed against the
                window edge. Same padding as Sign in, and a globe so it reads
                as a language switch before you can read the script. */}
            <Link
              href={switchHref}
              lang={locale === "fa" ? "en" : "fa"}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "hidden gap-1.5 sm:inline-flex",
              )}
            >
              <Globe size={15} aria-hidden />
              {t.language}
            </Link>
            <Link
              href={localePath("/account", locale)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "hidden sm:inline-flex",
              )}
            >
              {session.email ?? t.signIn}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={isMenuOpen ? t.close : t.open}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* --- reading progress ------------------------------------------ */}
        <div
          ref={progressRef}
          aria-hidden
          className="rule-plasma absolute inset-x-0 bottom-0 h-px origin-left"
          style={{ transform: "scaleX(var(--scrolled, 0))" }}
        />
      </div>

      {/* --- mobile menu -------------------------------------------------- */}
      {isMenuOpen && (
        <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="container-page flex flex-col py-3" aria-label={t.mobile}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={localePath(item.href, locale)}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "border-b border-border/60 py-3 text-sm last:border-0",
                  isCurrent(item.href) && "font-semibold text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
            {/* Sign in and the language switch are hidden below `sm` in the
                bar itself, so without these two the mobile menu is the only
                place they exist — and they were missing from it. */}
            <Link
              href={localePath("/account", locale)}
              onClick={() => setIsMenuOpen(false)}
              className="border-t border-border/60 py-3 text-sm font-semibold"
            >
              {session.email ?? t.signIn}
            </Link>
            <Link
              href={switchHref}
              lang={locale === "fa" ? "en" : "fa"}
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex items-center gap-2 border-t border-border/60 py-3 text-sm"
            >
              <Globe size={15} aria-hidden />
              {t.language}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
