"use client";
import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(element: HTMLElement, options: Record<string, unknown>): void;
    } } };
  }
}

/**
 * Google's button is a cross-origin iframe with its own white/near-black surface,
 * 4px corners and Roboto, so it can never sit inside this design system cleanly.
 * We render the site's own secondary Button and lay Google's iframe over it,
 * invisible, so the click still opens Google's popup and returns the credential.
 * The visible button is decorative; the iframe keeps Google's accessible name.
 */
export function GoogleSignIn({ locale, label, disabled, onCredential, onUnavailable }: {
  locale: string;
  /** Visible copy, localized by the caller: "Continue with Google". */
  label: string;
  disabled: boolean;
  onCredential: (credential: string) => Promise<void>;
  onUnavailable: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  useEffect(() => { credentialHandler.current = onCredential; }, [onCredential]);

  const renderButton = useCallback(() => {
    const target = host.current;
    if (!window.google || !target) return false;
    target.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId!,
      callback: ({ credential }) => { void credentialHandler.current(credential); },
    });
    window.google.accounts.id.renderButton(target, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      locale,
      logo_alignment: "center",
      width: Math.max(200, Math.min(400, Math.floor(target.clientWidth || 320))),
    });
    // Google injects the iframe with negative margins and a fixed width. Pin it
    // to the button instead, so every pixel of the control is clickable. Google
    // re-applies its own inline width/margin after render, hence !important and
    // the second pass on the next frame and on load.
    const pinFrame = () => {
      const frame = target.querySelector("iframe");
      if (!frame) return;
      for (const [property, value] of [["position", "absolute"], ["inset", "0"], ["width", "100%"], ["height", "100%"], ["margin", "0"], ["border", "0"]]) {
        frame.style.setProperty(property, value, "important");
      }
    };
    pinFrame();
    requestAnimationFrame(pinFrame);
    target.querySelector("iframe")?.addEventListener("load", pinFrame, { once: true });
    return true;
  }, [clientId, locale]);

  useEffect(() => { if (window.google) renderButton(); }, [renderButton]);

  if (!clientId) return null;

  return <>
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={() => { if (!renderButton()) onUnavailable(); }}
      onError={onUnavailable}
    />
    <div className={cn(
      "group relative mt-5 overflow-hidden rounded-control focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
      disabled && "pointer-events-none opacity-45",
    )}>
      <Button
        type="button"
        variant="secondary"
        className="pointer-events-none w-full group-hover:bg-muted"
        aria-hidden="true"
        tabIndex={-1}
      >
        <GoogleMark />
        {label}
      </Button>
      <div
        ref={host}
        className="absolute inset-x-0 -bottom-0.5 top-0.5 opacity-[0.001]"
        inert={disabled}
        aria-busy={disabled}
        data-google-signin
      />
    </div>
  </>;
}

/** Google's official multicolour "G". It may only mark Google sign-in. */
function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[18px] shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>;
}
