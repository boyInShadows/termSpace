"use client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";
import { DashboardNav } from "./dashboard-nav";

/**
 * Gates every dashboard page behind a reader session and lays the side
 * navigation alongside the page body.
 *
 * The gate lives here rather than in each page so a new dashboard route cannot
 * accidentally ship ungated. It is a convenience, not a security boundary — the
 * API authenticates every `/api/community` request independently.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const session = useMarketplaceSession();

  if (session.loading) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">{t.wait}</p>
    );
  }

  if (!session.email) {
    return (
      <section className="mx-auto max-w-md rounded-xl border border-border bg-surface p-7 text-center">
        <h1 className="editorial text-3xl">{t.dashTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.dashSignIn}</p>
        <Link
          href="/account?next=%2Fdashboard"
          className={cn(buttonVariants({ variant: "primary" }), "mt-6")}
        >
          {t.signIn}
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
      <DashboardNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
