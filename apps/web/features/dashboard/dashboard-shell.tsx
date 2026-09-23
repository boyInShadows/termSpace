"use client";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { DashboardSidebar, DashboardTabBar } from "./dashboard-nav";
import { DashboardTopbar } from "./dashboard-topbar";
import { DashboardOverviewSkeleton } from "./overview";

/**
 * The dashboard frame — top bar, sidebar, bottom tab bar — and the reader
 * session gate for every page inside it.
 *
 * The gate lives here rather than in each page so a new dashboard route cannot
 * accidentally ship ungated. It is a convenience, not a security boundary — the
 * API authenticates every creator request independently.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard";
  const signInHref = `${localePath("/account", locale)}?next=${encodeURIComponent(pathname)}`;
  const isSignedOut = !session.loading && !session.email;

  useEffect(() => {
    if (isSignedOut) router.replace(signInHref);
  }, [isSignedOut, router, signInHref]);

  if (isSignedOut) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-5">
        <p className="text-sm text-muted-foreground" role="status">
          {t.dashboardHome.redirecting}{" "}
          <Link href={signInHref} className="text-primary underline-offset-4 hover:underline">
            {t.signIn}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardTopbar />
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <DashboardSidebar />
        {/* Bottom padding clears the fixed tab bar and Publish button below lg. */}
        <main className="min-w-0 px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-[1200px]">
            {session.loading ? <DashboardOverviewSkeleton /> : children}
          </div>
        </main>
      </div>
      <DashboardTabBar />
    </div>
  );
}
