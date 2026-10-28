"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, getOwnedCreatorProfile, logout } from "@/lib/api";
import type { OwnedCreatorProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { ProviderConnections } from "@/features/creator/provider-connections";
import { AccountSecurity } from "./account-security";
import { accountSecurityCopy } from "./account-security-copy";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-4 last:border-0 sm:grid-cols-[12rem_1fr]">
      <p className="text-sm font-medium">{label}</p>
      <div className="min-w-0 break-words text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function AccountSettings() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<OwnedCreatorProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setProfile(await getOwnedCreatorProfile());
      setStatus("ready");
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "CREATOR_PROFILE_NOT_FOUND") {
        setProfile(null);
        setStatus("ready");
      } else setStatus("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function signOut() {
    setSignOutError(null);
    try {
      await logout();
    } catch (cause) {
      const security = accountSecurityCopy[locale];
      setSignOutError(!(cause instanceof ApiError) ? security.signOutOffline
        : cause.status === 429 ? security.rateLimited
        : cause.status >= 500 ? t.serviceError
        : t.dashboardHome.signOutError);
      return;
    }
    await session.refresh();
    router.replace(localePath("/", locale));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {t.profile}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.settingsIntro}</p>
      </header>

      <section className="rounded-none border border-border bg-surface px-5">
        <Row label={t.email}><bdi dir="ltr">{session.email}</bdi></Row>
        <Row label={t.settingsCreator}>
          {status === "loading" ? <p role="status">{t.creatorHub.loading}</p> : status === "error" ? <div>
            <p role="alert">{t.creatorHub.loadError}</p>
            <Button variant="secondary" className="mt-2" onClick={() => void load()}>{t.creatorHub.retry}</Button>
          </div> : profile ? (
            <>
              <bdi dir="ltr" className="text-foreground">@{profile.handle}</bdi>
              <span className="mt-1 block text-xs">{t.settingsHandleFixed}</span>
              <Link className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href={localePath("/dashboard/studio", locale) + "#creator-profile"}>{t.creatorHub.editTitle}</Link>
            </>
          ) : (
            t.settingsNoCreator
          )}
        </Row>
      </section>

      <AccountSecurity />

      {profile && session.marketplaceRoles.includes("creator") && <ProviderConnections />}

      <Button variant="secondary" onClick={() => void signOut()}>
        {t.signOut}
      </Button>
      {signOutError && <p role="alert" className="text-sm text-destructive">{signOutError}</p>}
    </div>
  );
}
