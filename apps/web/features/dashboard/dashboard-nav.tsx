"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Settings, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";

/**
 * Dashboard side navigation.
 *
 * Every entry points at a real page — a nav item that goes nowhere is the same
 * dead end `pending.md` already tracks for the footer. Add a route before you
 * add its link.
 */
export function DashboardNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const items = [
    { href: "/dashboard", label: t.navOverview, icon: LayoutGrid },
    { href: "/dashboard/studio", label: t.navStudio, icon: Store },
    { href: "/dashboard/settings", label: t.navSettings, icon: Settings },
  ];

  return (
    <nav aria-label={t.dashboard} className="lg:sticky lg:top-24">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          // `/dashboard` would otherwise match every nested route.
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-md px-3 text-sm transition",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon size={16} className="shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
