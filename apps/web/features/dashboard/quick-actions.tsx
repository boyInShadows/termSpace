"use client";
import Link from "next/link";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { DashboardCard } from "./dashboard-card";

/** Ghost rows only — the sidebar's Publish is the page's one primary button. */
export function QuickActions() {
  const { locale, t } = useLocale();
  const copy = t.dashboardHome;
  const items = [
    { label: copy.quickPublish, href: "/creator/listings/new" },
    { label: copy.quickManage, href: "/creator" },
    { label: copy.quickSettings, href: "/dashboard/settings" },
  ];

  return (
    <DashboardCard title={copy.quickTitle}>
      <ul className="space-y-2 px-5 pb-5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={localePath(item.href, locale)}
              className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-border px-3 text-sm transition-colors hover:border-border-strong hover:bg-surface-raised"
            >
              {item.label}
              <span aria-hidden className="font-mono text-muted-foreground rtl:-scale-x-100">↗</span>
            </Link>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
