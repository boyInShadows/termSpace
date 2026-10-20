"use client";
import { createContext, useContext } from "react";
import type { Locale, copy } from "./i18n";

export type Messages = (typeof copy)[Locale];
const LocaleContext = createContext<{ locale: Locale; messages: Messages } | null>(null);
export function LocaleProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  return <LocaleContext.Provider value={{ locale, messages }}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale requires LocaleProvider");
  return { locale: context.locale, fa: context.locale === "fa", t: context.messages };
}
