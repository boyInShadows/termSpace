"use client";

import { useState, type FormEvent } from "react";
import { ApiError, createOwnedCreatorProfile, updateOwnedCreatorProfile } from "@/lib/api";
import type { OwnedCreatorProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ContextHelp } from "@/components/ui/context-help";
import { useLocale } from "@/lib/locale-context";
import { useMarketplaceSession } from "@/features/account/marketplace-session";

/**
 * Creates the creator profile (the studio's first step) or edits it (in Settings).
 * The heading and intro change with the mode; the caller supplies the container.
 */
export function CreatorProfileForm({ profile, onSaved, headingLevel = "h2", notice }: {
  profile: OwnedCreatorProfile | null;
  onSaved: (profile: OwnedCreatorProfile) => void;
  headingLevel?: "h1" | "h2" | "h3";
  /** A problem the caller already knows about, such as a failed profile load. */
  notice?: string | null;
}) {
  const { t } = useLocale();
  const session = useMarketplaceSession();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  // Controlled only so the picture beside the field previews an accepted address.
  const [avatar, setAvatar] = useState(profile?.avatarUrl ?? "");
  const Heading = headingLevel;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const data = new FormData(event.currentTarget);
    try {
      const next = profile
        ? await updateOwnedCreatorProfile({ name: String(data.get("name")), bio: String(data.get("bio")), avatarUrl: String(data.get("avatarUrl") ?? "").trim() || null })
        : await createOwnedCreatorProfile({ name: String(data.get("name")), handle: String(data.get("handle")), bio: String(data.get("bio")) });
      onSaved(next);
      setSaved(true);
      // Creating the profile grants the creator role, so the session must reload. An edit changes
      // nothing the session knows, and a reload would swap the page for its skeleton and lose this message.
      if (!profile) await session.refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "CREATOR_HANDLE_TAKEN") setError(t.creatorHub.handleTaken);
      else if (cause instanceof ApiError && cause.code === "CREATOR_ACCESS_REVOKED") setError(t.creatorHub.accessRevoked);
      else setError(cause instanceof ApiError ? cause.message : t.creatorHub.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  const shownError = error ?? notice ?? null;
  const hint = "mt-1 block text-xs text-muted-foreground";
  return <>
    <Heading id="creator-profile-title" className={headingLevel === "h3" ? "text-base font-semibold" : "font-semibold mt-2 text-xl"}>{profile ? t.creatorHub.editTitle : t.creatorHub.title}</Heading>
    <p className={headingLevel === "h3" ? "mt-1 max-w-prose text-sm text-muted-foreground" : "mt-3 text-muted-foreground"}>{profile ? t.creatorHub.editIntro : t.creatorHub.intro}</p>
    <form className={headingLevel === "h3" ? "mt-5 space-y-5" : "mt-7 space-y-5"} onSubmit={submit} aria-labelledby="creator-profile-title">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="creator-name" className="flex min-h-11 items-center text-sm font-medium">{t.creatorHub.name}</label><Input id="creator-name" name="name" required minLength={2} maxLength={80} pattern="(?=.*[A-Za-z])[\x20-\x7E]+" defaultValue={profile?.name} autoComplete="name" lang="en" dir="ltr" aria-describedby="creator-name-help" /><span id="creator-name-help" className={hint}>{t.creatorHub.nameHelp}</span></div>
        <div>
          <div className="flex min-h-11 items-center justify-between gap-2" data-help-anchor><label htmlFor="creator-handle" className="block text-sm font-medium">{t.creatorHub.handle}</label><ContextHelp label={t.creatorHub.handle} topic="handle" /></div>
          <Input id="creator-handle" name="handle" required={!profile} disabled={Boolean(profile)} minLength={3} maxLength={40} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={profile?.handle} dir="ltr" autoComplete="off" aria-describedby="creator-handle-help" />
          <span id="creator-handle-help" className={hint}>{profile ? t.creatorHub.handleLocked : t.creatorHub.handleHelp}</span>
        </div>
      </div>
      {profile && <div>
        <label htmlFor="creator-avatar" className="block text-sm font-medium">{t.creatorHub.avatar}</label>
        <div className="mt-2 flex items-center gap-3">
          <Avatar initials={profile.initials} src={/^https:\/\/(avatars|raw)\.githubusercontent\.com\/\S+$/.test(avatar) ? avatar : null} className="size-11 font-sans" />
          <Input id="creator-avatar" name="avatarUrl" type="url" maxLength={2048} pattern="https://(avatars|raw)\.githubusercontent\.com/\S+" value={avatar} onChange={(event) => setAvatar(event.target.value)} dir="ltr" autoComplete="off" aria-describedby="creator-avatar-help" className="min-w-0" />
        </div>
        <span id="creator-avatar-help" className={hint}>{t.creatorHub.avatarHelp}</span>
      </div>}
      <label className="block text-sm font-medium">{t.creatorHub.bio}<textarea name="bio" required minLength={20} maxLength={500} defaultValue={profile?.bio} className="mt-2 min-h-36 w-full rounded-control border border-input bg-surface px-3 py-3 text-base placeholder:text-muted-foreground/75 hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" /></label>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={submitting}>{submitting ? t.wait : profile ? t.creatorHub.save : t.creatorHub.create}</Button>
        {shownError && <p role="alert" className="text-sm text-destructive">{shownError}</p>}
        {saved && <p role="status" className="text-sm text-success">{t.creatorHub.saved}</p>}
      </div>
    </form>
  </>;
}
