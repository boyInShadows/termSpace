"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import {
  ApiError,
  deleteMyProduct,
  getCreatorProfile,
  getMyProducts,
  getPublishingCategories,
  setMyProductPublished,
} from "@/lib/api";
import type { CreatorProfile, OwnedProduct, PublishingCategory } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { cn, formatCount } from "@/lib/utils";
import { ClaimProfileForm } from "./claim-profile-form";
import { SubmitSkillForm } from "./submit-skill-form";

/**
 * The community publishing surface, rendered inside `DashboardShell`.
 *
 * Two states: signed in without a creator profile, and a full studio. The API
 * enforces the same order — publishing without a profile is a 404 there, not
 * just a hidden form here.
 */
export function CreatorDashboard() {
  const { t } = useLocale();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [products, setProducts] = useState<OwnedProduct[]>([]);
  const [categories, setCategories] = useState<PublishingCategory[]>([]);
  // `loaded` is only ever written from inside the async load, never
  // synchronously in the effect body, which would cascade renders.
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every state write here happens after an await, so calling this from an
  // effect never updates state synchronously during that effect.
  const load = useCallback(async () => {
    try {
      const [nextProfile, nextCategories] = await Promise.all([
        getCreatorProfile(),
        getPublishingCategories(),
      ]);
      const ownProducts = nextProfile ? await getMyProducts() : [];
      setError(null);
      setProfile(nextProfile);
      setCategories(nextCategories);
      setProducts(ownProducts);
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.status === 401)) {
        setError(t.serviceError);
      }
      setProfile(null);
    } finally {
      setLoaded(true);
    }
  }, [t.serviceError]);

  useEffect(() => {
    if (session.loading || !session.email) return;
    // The studio reads three reader-authenticated endpoints, so the request
    // cannot start until the browser session is known. Every state write in
    // `load` happens after an await; the rule flags the call site rather than
    // tracking that. Same shape as `marketplace-session.tsx`, which pending.md
    // already tracks for a move to server-side fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [session.loading, session.email, load]);

  async function togglePublished(product: OwnedProduct) {
    const next = !product.published;
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, published: next } : item)),
    );
    try {
      await setMyProductPublished(product.slug, next);
    } catch {
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, published: !next } : item)),
      );
      setError(t.serviceError);
    }
  }

  async function remove(product: OwnedProduct) {
    if (!window.confirm(t.dashDeleteConfirm)) return;
    const snapshot = products;
    setProducts((current) => current.filter((item) => item.id !== product.id));
    try {
      await deleteMyProduct(product.slug);
      // A listing with orders cannot be deleted; the API unpublishes it instead.
      await load();
    } catch {
      setProducts(snapshot);
      setError(t.serviceError);
    }
  }

  // `DashboardShell` has already established a reader session before this
  // component mounts, so only the data load is waited on here.
  if (!loaded) {
    return <p className="py-20 text-center text-sm text-muted-foreground">{t.wait}</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">{t.dashboard}</p>
        <h1 className="editorial mt-3 text-[clamp(2rem,1.4rem+2vw,3rem)] leading-[1.05]">
          {t.dashTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.dashIntro}</p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {!profile ? (
        <ClaimProfileForm
          onClaimed={(claimed) => {
            setProfile(claimed);
            setProducts([]);
          }}
        />
      ) : (
        <>
          <section className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-5">
            <Avatar initials={profile.initials} />
            <div className="min-w-0">
              <p className="font-semibold">{profile.name}</p>
              <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            </div>
            <div className="ms-auto">
              {profile.verified ? (
                <Badge variant="success">
                  <ShieldCheck size={12} />
                  Verified
                </Badge>
              ) : (
                <p className="max-w-xs text-xs text-muted-foreground">{t.dashUnverifiedNote}</p>
              )}
            </div>
          </section>

          <SubmitSkillForm
            categories={categories}
            onPublished={(product) => setProducts((current) => [product, ...current])}
          />

          <section>
            <h2 className="editorial text-2xl">{t.dashListings}</h2>
            {products.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t.dashNoListings}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge variant={product.published ? "success" : "default"}>
                          {product.published ? t.dashLive : t.dashHidden}
                        </Badge>
                        <Badge variant="info">{product.type}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {product.outcome}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.category} · {t.dashFree} ·{" "}
                        {formatCount(product.usageCount)} uses
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {product.published && (
                        <Link
                          href={`/products/${product.slug}`}
                          aria-label={`${t.dashViewPublic}: ${product.name}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                        >
                          <ExternalLink size={14} />
                          {t.dashViewPublic}
                        </Link>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void togglePublished(product)}
                      >
                        {product.published ? t.dashHide : t.dashMakeLive}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => void remove(product)}
                      >
                        {t.dashDelete}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
