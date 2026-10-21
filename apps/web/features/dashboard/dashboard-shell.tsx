"use client";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { EmailVerification } from "@/features/account/email-verification";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";
import { DashboardSidebar, DashboardTabBar } from "./dashboard-nav";
import { DashboardSearch } from "./dashboard-search";
import { DashboardOverviewSkeleton } from "./overview";

/**
 * Workspace search, sidebar, bottom tabs and the reader session gate below
 * the root layout's shared global navigation.
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
  const isSignedOut = !session.identityLoading && !session.email;

  useEffect(() => {
    // Smooth page scrolling can leave keyboard focus behind the fixed tab bar.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    return () => { root.style.scrollBehavior = previous; };
  }, []);

  useEffect(() => {
    if (isSignedOut) router.replace(signInHref);
  }, [isSignedOut, router, signInHref]);

  if (isSignedOut) {
    return (
      <main id="content" tabIndex={-1} className="grid min-h-dvh place-items-center bg-background px-5">
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
    <div className="dashboard-operate min-h-[calc(100dvh-var(--site-header-height))] bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <DashboardSidebar />
        {/* Bottom padding clears the fixed tab bar below lg. */}
        <main id="content" tabIndex={-1} className="min-w-0 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-[1200px]">
            <DashboardSearch />
            <div>
                {session.identityLoading ? <DashboardOverviewSkeleton /> : !session.emailVerified ? <EmailVerification /> : children}
            </div>
          </div>
        </main>
      </div>
      <DashboardTabBar />
    </div>
  );
}
