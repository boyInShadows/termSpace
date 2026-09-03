"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, getCreatorProfile, logout } from "@/lib/api";
import type { CreatorProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border py-4 last:border-0 sm:grid-cols-[12rem_1fr]">
      <p className="text-sm font-medium">{label}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function AccountSettings() {
  const { t } = useLocale();
  const router = useRouter();
  const session = useMarketplaceSession();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const load = useCallback(async () => {
    try {
      setProfile(await getCreatorProfile());
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.status === 401)) {
        console.error("Settings failed to load the creator profile", cause);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">{t.dashboard}</p>
        <h1 className="editorial mt-3 text-[clamp(1.9rem,1.3rem+1.8vw,2.75rem)] leading-tight">
          {t.settingsTitle}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.settingsIntro}</p>
      </header>

      <section className="rounded-xl border border-border bg-surface px-5">
        <Row label={t.email}>{session.email}</Row>
        <Row label={t.settingsCreator}>
          {profile ? (
            <>
              <span className="text-foreground">@{profile.handle}</span>
              <span className="mt-1 block text-xs">{t.settingsHandleFixed}</span>
            </>
          ) : (
            t.settingsNoCreator
          )}
        </Row>
      </section>

      <Button
        variant="secondary"
        onClick={async () => {
          await logout();
          await session.refresh();
          router.replace("/");
          router.refresh();
        }}
      >
        {t.signOut}
      </Button>
    </div>
  );
}
