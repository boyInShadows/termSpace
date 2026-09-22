"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getFavorites, getSession, setFavorite, type MarketplaceRole } from "@/lib/api";

type SessionState = {
  loading: boolean; email: string | null; emailVerified: boolean; marketplaceRoles: MarketplaceRole[]; error: string | null;
  isFavorite: (slug: string) => boolean; toggleFavorite: (slug: string) => Promise<void>; refresh: () => Promise<void>;
};
const anonymousSession: SessionState = { loading: false, email: null, emailVerified: false, marketplaceRoles: [], error: null, isFavorite: () => false, toggleFavorite: async () => {}, refresh: async () => {} };
const SessionContext = createContext<SessionState>(anonymousSession);

export function MarketplaceSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
      setEmail(session.data.user.email);
      setEmailVerified(session.data.user.emailVerified);
      setMarketplaceRoles(session.data.user.marketplaceRoles);
      setFavorites(new Set(await getFavorites()));
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
    if (!email) { router.push(`/account?next=${encodeURIComponent(window.location.pathname)}`); return; }
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
  }, [email, favorites, router]);
  const value = useMemo(() => ({ loading, email, emailVerified, marketplaceRoles, error, isFavorite: (slug: string) => favorites.has(slug), toggleFavorite, refresh }), [loading, email, emailVerified, marketplaceRoles, error, favorites, toggleFavorite, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useMarketplaceSession() { return useContext(SessionContext); }
