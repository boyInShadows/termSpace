"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "../ui/avatar";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { ApiError, getOwnedCreatorProfile, logout } from "@/lib/api";
import type { OwnedCreatorProfile } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";

export function useSignOut() {
  const router = useRouter();
  const session = useMarketplaceSession();
  const { locale } = useLocale();
  return async () => {
    await logout();
    await session.refresh();
    router.replace(localePath("/", locale));
    router.refresh();
  };
}

const itemClass =
  "flex min-h-10 w-full items-center rounded-nav px-3 text-start text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

/**
 * A disclosure, not an ARIA menu: a button that shows a short list of links
 * and one action. Tab moves through it like any other part of the page, so
 * there is no arrow-key model to get wrong, and no menu library in the
 * first-load bundle of every page.
 */
export function AccountMenu({ email }: { email: string }) {
  const { locale, t } = useLocale();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const [identity, setIdentity] = useState<{ email: string; profile: OwnedCreatorProfile | null } | null>(null);
  const profile = identity?.email === email ? identity.profile : null;
  const words = profile?.name.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = (words.length > 1
    ? `${Array.from(words[0])[0]}${Array.from(words[words.length - 1])[0]}`
    : Array.from(words[0] ?? "").slice(0, 2).join("")).toUpperCase() || "?";

  useEffect(() => {
    let active = true;
    void getOwnedCreatorProfile().then(profile => {
      if (active) setIdentity({ email, profile });
    }).catch(cause => {
      if (!active) return;
      if (!(cause instanceof ApiError && cause.code === "CREATOR_PROFILE_NOT_FOUND")) {
        console.error("Account public profile could not load", cause);
      }
      setIdentity({ email, profile: null });
    });
    return () => { active = false; };
  }, [email]);

  useEffect(() => {
    if (!open) return;
    const outside = (target: EventTarget | null) =>
      !rootRef.current?.contains(target as Node | null);
    const onPointerDown = (event: PointerEvent) => {
      if (outside(event.target)) setOpen(false);
    };
    // Focus leaving by keyboard closes it too. Listening for focus *arriving*
    // elsewhere, not for blur, so a browser that does not focus a button on
    // click cannot close the panel before the click lands.
    const onFocusIn = (event: FocusEvent) => {
      if (outside(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t.account}
        title={t.account}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Avatar initials={initials} src={profile?.avatarUrl} className="size-8 font-sans text-xs" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute end-0 top-full z-50 mt-2 w-60 rounded-card border border-border bg-surface p-1 shadow-panel"
        >
          <p
            dir="auto"
            title={email}
            className="truncate px-3 py-2 text-xs text-muted-foreground"
          >
            {email}
          </p>
          <div role="separator" className="my-1 h-px bg-border" />
          <Link
            href={localePath("/dashboard", locale)}
            onClick={() => setOpen(false)}
            className={itemClass}
          >
            {t.dashboard}
          </Link>
          <div role="separator" className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className={cn(itemClass, "cursor-pointer")}
          >
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
