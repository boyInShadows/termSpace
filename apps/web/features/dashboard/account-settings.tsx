"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, getOwnedCreatorProfile, logout } from "@/lib/api";
import type { OwnedCreatorProfile } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { ProviderConnections } from "@/features/creator/provider-connections";
import { CreatorProfileForm } from "@/features/creator/creator-profile-form";
import { AccountSecurity, type ProfileState } from "./account-security";
import { accountSecurityCopy } from "./account-security-copy";
import { AccountPreferences } from "./account-preferences";
import { AccountData } from "./account-data";
import { AccountEmail } from "./account-email";
import { accountSettingsCopy } from "./account-settings-copy";
import { SectionIndex, SettingsGroup, SettingsPanel } from "./settings-panel";
import { AccountOnboarding } from "@/features/account/account-onboarding";

export function AccountSettings() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<OwnedCreatorProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [readerProfile, setReaderProfile] = useState<ProfileState>({ status: "loading" });

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

  // The studio's "Edit your profile" link lands here; the form only exists once the profile has loaded.
  useEffect(() => {
    if (status === "ready" && profile && window.location.hash === "#creator-profile") {
      document.getElementById("creator-profile")?.scrollIntoView({ block: "start" });
    }
  }, [status, profile]);

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

  const text = accountSettingsCopy[locale];
  const showConnections = Boolean(profile) && session.marketplaceRoles.includes("creator");
  const groups = [
    { id: "profile", title: text.profile },
    { id: "account", title: text.account },
    { id: "preferences", title: text.preferences },
    ...(showConnections ? [{ id: "connections", title: text.connections }] : []),
    { id: "data", title: text.data },
  ];

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          {t.profile}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.settingsIntro}</p>
        {profile && <div className="mt-5 flex items-center gap-3">
          <Avatar initials={profile.initials} src={profile.avatarUrl} className="size-12 font-sans text-base" />
          <p className="min-w-0 text-sm">
            <bdi className="block truncate font-medium">{profile.name}</bdi>
            <bdi dir="ltr" className="block truncate text-muted-foreground">@{profile.handle}</bdi>
          </p>
        </div>}
      </header>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[11rem_minmax(0,44rem)] lg:gap-10">
        <SectionIndex label={text.onThisPage} items={groups} />

        <div className="mt-6 space-y-8 lg:mt-0">
          <SettingsGroup id="profile" title={text.profile}>
            {status === "ready" && profile ? (
              <SettingsPanel id="creator-profile" titleId="creator-profile-title" title={profile.accessActive ? undefined : t.creatorHub.editTitle}>
                {profile.accessActive
                  ? <CreatorProfileForm profile={profile} onSaved={setProfile} headingLevel="h3" />
                  : <p className="mt-3 text-sm text-muted-foreground" role="status">{t.creatorHub.accessRevoked}</p>}
              </SettingsPanel>
            ) : (
              <SettingsPanel titleId="creator-identity-title" title={t.settingsCreator}>
                {status === "loading" ? <p role="status" className="mt-3 text-sm text-muted-foreground">{t.creatorHub.loading}</p>
                  : status === "error" ? <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p role="alert" className="text-sm text-destructive">{t.creatorHub.loadError}</p>
                    <Button variant="secondary" onClick={() => void load()}>{t.creatorHub.retry}</Button>
                  </div>
                  : <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{t.settingsNoCreator}</p>
                    <Link className={buttonVariants({ variant: "secondary" })} href={localePath("/dashboard/studio", locale)}>{t.creatorHub.title}</Link>
                  </div>}
              </SettingsPanel>
            )}
            <AccountOnboarding />
          </SettingsGroup>

          <SettingsGroup id="account" title={text.account}>
            <AccountEmail profile={readerProfile} />
            <AccountSecurity onProfileState={setReaderProfile}>
              <Button variant="secondary" onClick={() => void signOut()}>{t.signOut}</Button>
              {signOutError && <p role="alert" className="text-sm text-destructive">{signOutError}</p>}
            </AccountSecurity>
          </SettingsGroup>

          <SettingsGroup id="preferences" title={text.preferences}>
            <AccountPreferences />
          </SettingsGroup>

          {showConnections && <SettingsGroup id="connections" title={text.connections}>
            <ProviderConnections />
          </SettingsGroup>}

          <SettingsGroup id="data" title={text.data}>
            <AccountData profile={readerProfile} />
          </SettingsGroup>
        </div>
      </div>
    </div>
  );
}
