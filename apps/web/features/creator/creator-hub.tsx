"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, getOwnedCreatorProfile } from "@/lib/api";
import type { OwnedCreatorProfile } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { CreatorDashboard } from "./creator-dashboard";
import { CreatorProfileForm } from "./creator-profile-form";

/** The studio creates the profile; once it exists it is edited in Settings. */
export function CreatorHub() {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<OwnedCreatorProfile | null>();
  const [error, setError] = useState<string | null>(null);

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

  if (session.loading) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.loading} />;
  if (!session.email) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.signInRequired} action={<Link className={buttonVariants()} href={`${localePath("/account", locale)}?next=${encodeURIComponent(localePath("/dashboard/studio", locale))}`}>{t.signIn}</Link>} />;
  if (!session.emailVerified) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.verifyRequired} action={<Link className={buttonVariants()} href={localePath("/account/verify-email", locale)}>{t.verifyEmail}</Link>} />;
  if (profile === undefined && !error) return <StatusCard title={t.creatorHub.title} message={t.creatorHub.loading} />;
  if (profile && !profile.accessActive) return <StatusCard title={t.creatorHub.editTitle} message={t.creatorHub.accessRevoked} />;

  if (!profile) {
    return <section className="mx-auto max-w-2xl rounded-card border bg-surface p-7" aria-labelledby="creator-profile-title">
      <CreatorProfileForm profile={null} onSaved={setProfile} headingLevel="h1" notice={error} />
    </section>;
  }
  return <div className="mx-auto max-w-6xl">
    <Link className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4" href={`${localePath("/dashboard/settings", locale)}#creator-profile`}>{t.creatorHub.editTitle}</Link>
    <CreatorDashboard />
  </div>;
}

function StatusCard({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <section className="mx-auto max-w-lg rounded-card border bg-surface p-7">
    <h1 className="font-semibold text-2xl">{title}</h1>
    <p className="mt-3 text-muted-foreground" role="status">{message}</p>
    {action && <div className="mt-7">{action}</div>}
  </section>;
}
