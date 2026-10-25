"use client";
import { createContext, useContext } from "react";
import { ThemeProvider } from "next-themes";
import { MarketplaceSessionProvider } from "@/features/account/marketplace-session";
import { LocaleProvider, type Messages } from "@/lib/locale-context";
import type { Locale } from "@/lib/i18n";
import type { ReaderSession } from "@/lib/api";

const CspNonceContext = createContext<string | undefined>(undefined);
export const useCspNonce = () => useContext(CspNonceContext);

/**
 * Dark is the declared default rather than "system": the Void ground is what
 * makes Plasma read as emission instead of paint, so it is the composition
 * the brand is designed around. The toggle in the header gives full control,
 * and next-themes persists the choice.
 *
 * disableTransitionOnChange is deliberately off — the theme toggle's
 * cross-rotating icons are the switch's whole affordance, and that flag would
 * suppress them along with everything else.
 */
export function Providers({ children, locale, messages, nonce, initialSession }: { children: React.ReactNode; locale: Locale; messages: Messages; nonce?: string; initialSession?: ReaderSession }) {
  return (
    <CspNonceContext.Provider value={nonce}>
      <ThemeProvider nonce={nonce} attribute="class" defaultTheme="dark" enableSystem={false}>
        <LocaleProvider locale={locale} messages={messages}><MarketplaceSessionProvider initialSession={initialSession}>{children}</MarketplaceSessionProvider></LocaleProvider>
      </ThemeProvider>
    </CspNonceContext.Provider>
  );
}
