"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getFavorites, getSession, setFavorite, type MarketplaceRole } from "@/lib/api";
import { localePath } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-context";

type SessionState = {
  loading: boolean; email: string | null; emailVerified: boolean; marketplaceRoles: MarketplaceRole[]; error: string | null;
  isFavorite: (slug: string) => boolean; toggleFavorite: (slug: string) => Promise<void>; removeFavorite: (slug: string) => Promise<void>; refresh: () => Promise<void>;
};
const anonymousSession: SessionState = { loading: false, email: null, emailVerified: false, marketplaceRoles: [], error: null, isFavorite: () => false, toggleFavorite: async () => {}, removeFavorite: async () => {}, refresh: async () => {} };
const SessionContext = createContext<SessionState>(anonymousSession);

export function MarketplaceSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [marketplaceRoles, setMarketplaceRoles] = useState<MarketplaceRole[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const session = await getSession();
      if (!session.data.authenticated) {
        // Anonymous: the API answers 200 so a signed-out page view does not
        // log a failed request. A 401 is still treated the same, below.
        setEmail(null); setEmailVerified(false); setMarketplaceRoles([]); setFavorites(new Set());
        return;
      }
      setEmail(session.data.user.email);
      setEmailVerified(session.data.user.emailVerified);
      setMarketplaceRoles(session.data.user.marketplaceRoles);
      try { setFavorites(new Set(await getFavorites())); }
      catch (cause) {
        if (cause instanceof ApiError && cause.status === 401) throw cause;
        setFavorites(new Set());
        setError("Could not load your saved products.");
      }
    } catch (cause) {
      // A 401 means "not signed in"; an unreachable or timed-out API means
      // "we cannot tell who you are". Both leave the visitor anonymous, and
      // neither is something they can act on, so neither is reported. Only a
      // service that answered and failed is worth surfacing.
      if (!(cause instanceof ApiError && (cause.status === 401 || cause.status === 0 || cause.code === "CLIENT_TIMEOUT"))) {
        console.error("Marketplace session load failed", cause);
        setError("Account services are temporarily unavailable.");
      }
      setEmail(null); setEmailVerified(false); setMarketplaceRoles([]); setFavorites(new Set());
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  const toggleFavorite = useCallback(async (slug: string) => {
    if (!email) { router.push(`${localePath("/account", locale)}?next=${encodeURIComponent(window.location.pathname)}`); return; }
    const wasSaved = favorites.has(slug);
    setFavorites((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(slug); else next.add(slug);
      return next;
    });
    try { await setFavorite(slug, !wasSaved); }
    catch (cause) {
      setFavorites((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(slug); else next.delete(slug);
        return next;
      });
      console.error("Favorite update failed", cause); setError("Could not update your saved products.");
    }
  }, [email, favorites, locale, router]);
  const removeFavorite = useCallback(async (slug: string) => {
    await setFavorite(slug, false);
    setFavorites((current) => {
      const next = new Set(current);
      next.delete(slug);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ loading, email, emailVerified, marketplaceRoles, error, isFavorite: (slug: string) => favorites.has(slug), toggleFavorite, removeFavorite, refresh }), [loading, email, emailVerified, marketplaceRoles, error, favorites, toggleFavorite, removeFavorite, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useMarketplaceSession() { return useContext(SessionContext); }
