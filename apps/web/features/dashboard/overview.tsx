"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ApiError, getCreatorProfile, getMyProducts } from "@/lib/api";
import type { CreatorProfile, OwnedProduct } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function DashboardOverview() {
  const { t } = useLocale();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [products, setProducts] = useState<OwnedProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Every state write follows an await, so this never sets state synchronously
  // inside the effect below.
  const load = useCallback(async () => {
    try {
      const nextProfile = await getCreatorProfile();
      const owned = nextProfile ? await getMyProducts() : [];
      setProfile(nextProfile);
      setProducts(owned);
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.status === 401)) {
        console.error("Dashboard overview failed to load", cause);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const live = products.filter((product) => product.published).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">{t.dashboard}</p>
        <h1 className="editorial mt-3 text-[clamp(1.9rem,1.3rem+1.8vw,2.75rem)] leading-tight">
          {t.overviewTitle}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t.overviewGreeting} {session.email}
        </p>
      </header>

      {!loaded ? (
        <p className="text-sm text-muted-foreground">{t.wait}</p>
      ) : profile ? (
        <>
          <section className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <Avatar initials={profile.initials} />
            <div className="min-w-0">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            </div>
            <Link
              href="/dashboard/studio"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "ms-auto gap-1.5")}
            >
              {t.overviewOpenStudio}
              <ArrowRight size={14} />
            </Link>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <Stat label={t.overviewListings} value={products.length} />
            <Stat label={t.overviewLive} value={live} />
            <Stat label={t.overviewHidden} value={products.length - live} />
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">{t.overviewNoProfile}</p>
          <Link
            href="/dashboard/studio"
            className={cn(buttonVariants({ variant: "primary" }), "mt-5 gap-1.5")}
          >
            {t.overviewOpenStudio}
            <ArrowRight size={15} />
          </Link>
        </section>
      )}
    </div>
  );
}
