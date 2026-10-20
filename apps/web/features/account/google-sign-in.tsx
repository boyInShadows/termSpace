"use client";
import { useRef } from "react";
import Script from "next/script";
import { useCspNonce } from "@/components/layout/providers";

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(element: HTMLElement, options: Record<string, unknown>): void;
    } } };
  }
}

export function GoogleSignIn({ locale, text = "signin_with", disabled, onCredential, onUnavailable }: {
  locale: string;
  /** Google's own wording for the button: "Sign in with Google" or "Sign up with Google". */
  text?: "signin_with" | "signup_with";
  disabled: boolean;
  onCredential: (credential: string) => Promise<void>;
  onUnavailable: () => void;
}) {
  const nonce = useCspNonce();
  const button = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  function renderButton() {
    if (!window.google || !button.current) { onUnavailable(); return; }
    button.current.replaceChildren();
    window.google.accounts.id.initialize({ client_id: clientId!, callback: ({ credential }) => { void onCredential(credential); } });
    window.google.accounts.id.renderButton(button.current, { theme: "outline", size: "large", text, locale, width: Math.min(320, button.current.clientWidth || 320) });
  }

  return <>
    <Script nonce={nonce} src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={renderButton} onError={onUnavailable} />
    <div ref={button} className="mt-5 flex justify-center" inert={disabled} aria-busy={disabled} />
  </>;
}
