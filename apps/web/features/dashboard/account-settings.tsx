"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, KeyRound, ShieldCheck, UserRound, Vault } from "lucide-react";
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
import { accountSettingsCopy } from "./account-settings-copy";
import { SettingRow, SettingRows, SettingsGroup, SettingsNav, SettingsPanel, useReturnFocus, type SettingsSection } from "./settings-panel";

export function AccountSettings() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const session = useMarketplaceSession();
  const requested = useSearchParams().get("section");
  const [profile, setProfile] = useState<OwnedCreatorProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [readerProfile, setReaderProfile] = useState<ProfileState>({ status: "loading" });
  const content = useRef<HTMLDivElement>(null);

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

  const text = accountSettingsCopy[locale];
  const showConnections = Boolean(profile) && session.marketplaceRoles.includes("creator");
  // Connections has no section intro: its one panel already explains itself.
  const sections: (SettingsSection & { intro?: string })[] = [
    { id: "profile", title: text.profile, intro: text.profileIntro, icon: UserRound },
    { id: "account", title: text.account, intro: text.accountIntro, icon: ShieldCheck },
    { id: "notifications", title: text.preferences, intro: text.preferencesIntro, icon: Bell },
    ...(showConnections ? [{ id: "connections", title: text.connections, icon: KeyRound }] : []),
    { id: "privacy", title: text.data, intro: text.dataIntro, icon: Vault },
  ];
  // An unknown or unavailable section (Connections before the profile loads) shows Profile.
  const current = sections.some((section) => section.id === requested) ? requested! : "profile";
  const base = localePath("/dashboard/settings", locale);
  const group = (id: string) => sections.find((section) => section.id === id)!;

  // Switching sections keeps the scroll position, so bring a section that starts above the viewport back into view.
  const previous = useRef(current);
  useEffect(() => {
    if (previous.current === current) return;
    previous.current = current;
    if (content.current && content.current.getBoundingClientRect().top < 0) content.current.scrollIntoView({ block: "start" });
  }, [current]);

  const name = profile?.name ?? session.email ?? "";
  return (
    <div>
      <header className="flex flex-wrap items-center gap-4">
        <Avatar
          initials={profile?.initials ?? (session.email?.[0] ?? "").toUpperCase()}
          src={profile?.avatarUrl}
          className="size-14 font-sans text-lg"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">{t.profile}</h1>
          <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            {profile && <><bdi className="font-medium text-foreground">{name}</bdi><bdi dir="ltr">@{profile.handle}</bdi><span aria-hidden="true" className="hidden sm:inline">·</span></>}
            <bdi dir="ltr" className="break-all">{session.email}</bdi>
          </p>
        </div>
      </header>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[12rem_minmax(0,44rem)] lg:gap-10">
        <SettingsNav label={text.sectionsLabel} items={sections} current={current} hrefFor={(id) => id === "profile" ? base : `${base}?section=${id}`} />

        <div ref={content} className="mt-6 scroll-mt-[calc(var(--site-header-height)+1.5rem)] lg:mt-0">
          <SettingsGroup {...group("profile")} active={current === "profile"}>
            <CreatorProfilePanel profile={profile} status={status} onSaved={setProfile} onRetry={() => void load()} />
          </SettingsGroup>

          <SettingsGroup {...group("account")} active={current === "account"}>
            <AccountSecurity
              onProfileState={setReaderProfile}
              signOut={<Button size="sm" variant="secondary" onClick={() => void signOut()}>{t.signOut}</Button>}
              signOutError={signOutError}
            />
          </SettingsGroup>

          <SettingsGroup {...group("notifications")} active={current === "notifications"}>
            <AccountPreferences />
          </SettingsGroup>

          {showConnections && <SettingsGroup {...group("connections")} active={current === "connections"}>
            <ProviderConnections />
          </SettingsGroup>}

          <SettingsGroup {...group("privacy")} active={current === "privacy"}>
            <AccountData profile={readerProfile} />
          </SettingsGroup>
        </div>
      </div>
    </div>
  );
}

/** The public creator identity: a read-only summary until Edit opens the form in its place. */
function CreatorProfilePanel({ profile, status, onSaved, onRetry }: {
  profile: OwnedCreatorProfile | null;
  status: "loading" | "ready" | "error";
  onSaved: (profile: OwnedCreatorProfile) => void;
  onRetry: () => void;
}) {
  const { locale, t } = useLocale();
  const text = accountSettingsCopy[locale];
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const editButton = useReturnFocus(editing);
  const deepLinked = useRef(false);

  // The studio's "Edit your profile" link lands here with the form open. Only once: the hash stays
  // in the URL, and a save changes `profile`, which must not reopen the form.
  useEffect(() => {
    if (deepLinked.current || status !== "ready" || !profile?.accessActive || window.location.hash !== "#creator-profile") return;
    deepLinked.current = true;
    setEditing(true);
    document.getElementById("creator-profile")?.scrollIntoView({ block: "start" });
  }, [status, profile]);

  function close(wasSaved: boolean) {
    setSaved(wasSaved);
    setEditing(false);
  }

  if (status !== "ready" || !profile) {
    return <SettingsPanel titleId="creator-identity-title" title={t.settingsCreator}>
      {status === "loading" ? <p role="status" className="mt-3 text-sm text-muted-foreground">{t.creatorHub.loading}</p>
        : status === "error" ? <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">{t.creatorHub.loadError}</p>
          <Button variant="secondary" onClick={onRetry}>{t.creatorHub.retry}</Button>
        </div>
        : <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{t.settingsNoCreator}</p>
          <Link className={buttonVariants({ variant: "secondary" })} href={localePath("/dashboard/studio", locale)}>{t.creatorHub.title}</Link>
        </div>}
    </SettingsPanel>;
  }

  if (!profile.accessActive) {
    return <SettingsPanel id="creator-profile" titleId="creator-profile-title" title={t.creatorHub.editTitle}>
      <p className="mt-3 text-sm text-muted-foreground" role="status">{t.creatorHub.accessRevoked}</p>
    </SettingsPanel>;
  }

  if (editing) {
    return <SettingsPanel id="creator-profile" titleId="creator-profile-title">
      <CreatorProfileForm profile={profile} onSaved={(next) => { onSaved(next); close(true); }} headingLevel="h3"
        cancel={<Button type="button" variant="ghost" onClick={() => close(false)}>{text.cancel}</Button>} />
    </SettingsPanel>;
  }

  return <SettingsPanel
    id="creator-profile"
    titleId="creator-profile-title"
    title={t.creatorHub.editTitle}
    description={t.creatorHub.editIntro}
    action={<Button ref={editButton} size="sm" variant="secondary" aria-expanded={false} aria-label={`${text.edit} — ${t.creatorHub.editTitle}`} onClick={() => { setSaved(false); setEditing(true); }}>{text.edit}</Button>}
  >
    <SettingRows>
      <SettingRow label={t.creatorHub.name} value={<bdi dir="ltr" lang="en" className="text-foreground">{profile.name}</bdi>} />
      <SettingRow label={t.creatorHub.handle} value={<bdi dir="ltr" className="font-mono text-[13px]">{profile.handle}</bdi>} />
      <SettingRow label={t.creatorHub.bio} value={<p className="ts-bidi line-clamp-3 whitespace-pre-line">{profile.bio}</p>} />
    </SettingRows>
    {saved && <p role="status" className="mt-4 text-sm text-success">{t.creatorHub.saved}</p>}
  </SettingsPanel>;
}
