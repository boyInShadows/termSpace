"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { locale, fa, t } = useLocale();
  const session = useMarketplaceSession();
  const pathname = usePathname() ?? "/dashboard";
  const query = useSearchParams().toString();
  const path = pathname.startsWith("/fa/") ? pathname.slice(3) : pathname;
  const canCreate = session.marketplaceRoles.includes("creator");
  const canModerate = session.marketplaceRoles.includes("moderator") || session.marketplaceRoles.includes("administrator");

  if (session.loading) return <p role="status">{t.wait}</p>;
  if (session.error) return <p role="alert" className="text-destructive">{t.serviceError}</p>;
  if (!session.email) return <section className="rounded-xl border bg-surface p-7">
    <h1 className="editorial text-4xl">{t.dashboard.title}</h1>
    <p className="mt-3 text-muted-foreground">{t.creatorHub.signInRequired}</p>
    <Link className={cn(buttonVariants(), "mt-6")} href={`${localePath("/account", locale)}?next=${encodeURIComponent(`${pathname}${query ? `?${query}` : ""}`)}`}>{t.signIn}</Link>
  </section>;

  const restricted = (path === "/dashboard/moderation" || path.startsWith("/dashboard/moderation/")) && !canModerate
    || (path === "/dashboard/connections" || path.startsWith("/dashboard/creator/") && path !== "/dashboard/creator") && !canCreate
    || path === "/dashboard/moderation/communities" && !session.marketplaceRoles.includes("administrator");
  const links = [
    { href: "/dashboard", label: t.dashboard.accountLibrary },
    { href: "/dashboard/creator", label: t.dashboard.creator },
    { href: "/dashboard/cases", label: fa ? "پرونده‌ها و اعتراض‌ها" : "Cases and appeals" },
    ...(canCreate ? [{ href: "/dashboard/creator/collections", label: fa ? "مجموعه‌ها" : "Collections" }, { href: "/dashboard/creator/placements", label: fa ? "درخواست‌های جامعه" : "Placements" }, { href: "/dashboard/creator/reviews", label: fa ? "نظرها" : "Reviews" }] : []),
    ...(canCreate ? [{ href: "/dashboard/connections", label: t.dashboard.connections }] : []),
    ...(canModerate ? [{ href: "/dashboard/moderation", label: t.moderation.nav }] : []),
    ...(canModerate ? [{ href: "/dashboard/moderation/placements", label: fa ? "بررسی جایگاه‌ها" : "Placement review" }, { href: "/dashboard/moderation/cases", label: fa ? "بررسی پرونده‌ها" : "Case review" }, { href: "/dashboard/moderation/reviews", label: fa ? "بررسی نظرها" : "Review moderation" }] : []),
    ...(session.marketplaceRoles.includes("administrator") ? [{ href: "/dashboard/moderation/communities", label: fa ? "مدیریت جامعه‌ها" : "Communities" }] : []),
  ];

  return <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
    <aside>
      <p className="eyebrow">{t.dashboard.title}</p>
      <nav className="mt-4 flex flex-wrap gap-2 lg:flex-col" aria-label={t.dashboard.navigation}>
        {links.map(({ href, label }) => {
          const active = path === href || href !== "/dashboard" && path.startsWith(`${href}/`);
          return <Link key={href} href={localePath(href, locale)} aria-current={active ? "page" : undefined} className={cn("rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted", active && "bg-muted text-primary")}>
            {label}
          </Link>;
        })}
      </nav>
    </aside>
    <div className="min-w-0">{restricted
      ? <p role="alert" className="rounded-xl border bg-surface p-7 text-destructive">{t.moderation.accessDenied}</p>
      : children}</div>
  </div>;
}
