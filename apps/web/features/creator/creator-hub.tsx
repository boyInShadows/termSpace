"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, createOwnedCreatorProfile, getOwnedCreatorProfile, updateOwnedCreatorProfile } from "@/lib/api";
import type { OwnedCreatorProfile } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { CreatorDashboard } from "./creator-dashboard";

export function CreatorHub() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<OwnedCreatorProfile | null>();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session.loading || !session.email || !session.emailVerified) return;
    let active = true;
    void getOwnedCreatorProfile()
      .then((value) => { if (active) setProfile(value); })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof ApiError && cause.code === "CREATOR_PROFILE_NOT_FOUND") setProfile(null);
        else setError(t.creatorHub.loadError);
      });
    return () => { active = false; };
  }, [session.loading, session.email, session.emailVerified, t.creatorHub.loadError]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const data = new FormData(event.currentTarget);
    try {
      const next = profile
        ? await updateOwnedCreatorProfile({ name: String(data.get("name")), bio: String(data.get("bio")) })
        : await createOwnedCreatorProfile({ name: String(data.get("name")), handle: String(data.get("handle")), bio: String(data.get("bio")) });
      setProfile(next);
      setSaved(true);
      await session.refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "CREATOR_HANDLE_TAKEN") setError(t.creatorHub.handleTaken);
      else if (cause instanceof ApiError && cause.code === "CREATOR_ACCESS_REVOKED") setError(t.creatorHub.accessRevoked);
      else setError(cause instanceof ApiError ? cause.message : t.creatorHub.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  if (session.loading) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.loading} />;
  if (!session.email) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.signInRequired} action={<Link className={buttonVariants()} href={`${localePath("/account", locale)}?next=${encodeURIComponent(localePath("/creator", locale))}`}>{t.signIn}</Link>} />;
  if (!session.emailVerified) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.verifyRequired} action={<Link className={buttonVariants()} href={localePath("/account/verify-email", locale)}>{t.verifyEmail}</Link>} />;
  if (profile === undefined && !error) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.loading} />;
  if (profile && !profile.accessActive) return <StatusCard title={t.creatorHub.editTitle} message={t.creatorHub.accessRevoked} />;

  const profileForm = <section className="mx-auto max-w-2xl rounded-xl border bg-surface p-7" aria-labelledby="creator-profile-title">
    <p className="eyebrow">{profile ? t.creatorHub.profileEyebrow : t.creatorHub.onboardingEyebrow}</p>
    {profile
      ? <h2 id="creator-profile-title" className="editorial mt-2 text-4xl">{t.creatorHub.editTitle}</h2>
      : <h1 id="creator-profile-title" className="editorial mt-2 text-4xl">{t.creatorHub.title}</h1>}
    <p className="mt-3 text-muted-foreground">{profile ? t.creatorHub.editIntro : t.creatorHub.intro}</p>
    <form className="mt-7 space-y-5" onSubmit={submit}>
      <div><label htmlFor="creator-name" className="block text-sm font-medium">{t.creatorHub.name}</label><Input id="creator-name" name="name" required minLength={2} maxLength={80} pattern="(?=.*[A-Za-z])[\x20-\x7E]+" defaultValue={profile?.name} autoComplete="name" lang="en" dir="ltr" aria-describedby="creator-name-help" className="mt-2" /><span id="creator-name-help" className="mt-1 block text-xs text-muted-foreground">{t.creatorHub.nameHelp}</span></div>
      <div>
        <label htmlFor="creator-handle" className="block text-sm font-medium">{t.creatorHub.handle}</label>
        <Input id="creator-handle" name="handle" required={!profile} disabled={Boolean(profile)} minLength={3} maxLength={40} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={profile?.handle} dir="ltr" autoComplete="off" aria-describedby="creator-handle-help" className="mt-2" />
        <span id="creator-handle-help" className="mt-1 block text-xs text-muted-foreground">{profile ? t.creatorHub.handleLocked : t.creatorHub.handleHelp}</span>
      </div>
      <label className="block text-sm font-medium">{t.creatorHub.bio}<textarea name="bio" required minLength={20} maxLength={500} defaultValue={profile?.bio} className="mt-2 min-h-36 w-full rounded-md border border-input bg-surface px-3 py-3 text-sm placeholder:text-muted-foreground/75 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {saved && <p role="status" className="text-sm text-primary">{t.creatorHub.saved}</p>}
      <Button disabled={submitting}>{submitting ? t.wait : profile ? t.creatorHub.save : t.creatorHub.create}</Button>
    </form>
  </section>;

  if (!profile) return profileForm;
  return <div className="mx-auto max-w-6xl">
    <CreatorDashboard />
    <div className="mt-14 border-t pt-10">{profileForm}</div>
  </div>;
}

function StatusCard({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <section className="mx-auto max-w-lg rounded-xl border bg-surface p-7">
    <h1 className="editorial text-4xl">{title}</h1>
    <p className="mt-3 text-muted-foreground" role="status">{message}</p>
    {action && <div className="mt-7">{action}</div>}
  </section>;
}
