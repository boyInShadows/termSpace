"use client";
import { FormEvent, useState } from "react";
import { ApiError, createCreatorProfile } from "@/lib/api";
import type { CreatorProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/locale-context";

/** Suggests a handle from the display name so the field is rarely typed twice. */
function handleFrom(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function ClaimProfileForm({
  onClaimed,
}: {
  onClaimed: (profile: CreatorProfile) => void;
}) {
  const { t } = useLocale();
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const profile = await createCreatorProfile({
        name: String(data.get("name")).trim(),
        handle: String(data.get("handle")).trim().toLowerCase(),
        bio: String(data.get("bio")).trim(),
      });
      onClaimed(profile);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : t.serviceError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-7">
      <h2 className="editorial text-3xl">{t.dashClaimTitle}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {t.dashClaimIntro}
      </p>

      <form className="mt-7 space-y-5" onSubmit={submit}>
        <label className="block text-sm font-medium">
          {t.dashDisplayName}
          <Input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="mt-2"
            onChange={(event) => {
              if (!handleEdited) setHandle(handleFrom(event.target.value));
            }}
          />
        </label>

        <label className="block text-sm font-medium">
          {t.dashUsername}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">@</span>
            <Input
              name="handle"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
              value={handle}
              onChange={(event) => {
                setHandleEdited(true);
                setHandle(event.target.value.toLowerCase());
              }}
            />
          </div>
          <span className="mt-1.5 block text-xs font-normal text-muted-foreground">
            {t.dashUsernameHint}
          </span>
        </label>

        <label className="block text-sm font-medium">
          {t.dashBio}
          <textarea
            name="bio"
            required
            minLength={10}
            maxLength={400}
            rows={3}
            className="mt-2 w-full rounded-md border border-input bg-surface p-3 text-sm placeholder:text-muted-foreground/75 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button className="w-full" disabled={submitting}>
          {submitting ? t.wait : t.dashClaimCta}
        </Button>
      </form>
    </section>
  );
}
