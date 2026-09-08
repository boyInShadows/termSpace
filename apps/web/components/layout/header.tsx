"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "../ui/theme-toggle";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
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
export function Header() {
  const { locale, t } = useLocale();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const currentPath = locale === "fa" ? pathname.slice(3) || "/" : pathname;
  const query = searchParams.toString();
  const switchHref = `${locale === "fa" ? currentPath : localePath(currentPath, "fa")}${query ? `?${query}` : ""}`;
  const NAV = [
    { href: "/explore", label: t.explore },
    { href: "/design-system", label: t.designSystem },
    { href: "/#creators", label: t.sellWork },
  ] as const;
  const [isCondensed, setIsCondensed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const session = useMarketplaceSession();

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
    <>
      {/* --- announcement strip, retracts on scroll ---------------------- */}
      <div
        className={cn(
          "overflow-hidden border-b border-border/60 bg-surface/60 backdrop-blur transition-[height,opacity] duration-500",
          isCondensed ? "h-0 opacity-0" : "h-9 opacity-100",
        )}
      >
        <p className="flex h-9 items-center justify-center gap-2 px-4 text-center text-xs">
          <span className="size-1.5 rounded-full bg-accent" />
          <span className="text-muted-foreground">
            {t.announcement}
          </span>
          <Link
            href={localePath("/explore", locale)}
            className="group inline-flex items-center gap-1 font-semibold text-primary"
          >
            {t.explore}
            <ArrowRight
              size={12}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Link>
        </p>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
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
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href.startsWith("#") ? item.href : localePath(item.href, locale)}
                className="group relative py-1 transition-colors hover:text-primary"
              >
                {item.label}
                <span
                  aria-hidden
                  className="rule-plasma absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href={localePath("/account", locale)} className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:inline-flex")}>
              {session.email ?? t.signIn}
            </Link>
            <Link href={switchHref} className="hidden px-2 text-xs text-muted-foreground hover:text-primary sm:inline-flex">{t.language}</Link>
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
      </header>

      {/* --- mobile menu ------------------------------------------------- */}
      {isMenuOpen && (
        <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur-xl md:hidden">
            <nav className="container-page flex flex-col py-3" aria-label={t.mobile}>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href.startsWith("#") ? item.href : localePath(item.href, locale)}
                onClick={() => setIsMenuOpen(false)}
                className="border-b border-border/60 py-3 text-sm last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
