"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getFavorites, getSession, setFavorite } from "@/lib/api";

type SessionState = {
  loading: boolean; email: string | null; error: string | null;
  isFavorite: (slug: string) => boolean; toggleFavorite: (slug: string) => Promise<void>; refresh: () => Promise<void>;
};
const anonymousSession: SessionState = { loading: false, email: null, error: null, isFavorite: () => false, toggleFavorite: async () => {}, refresh: async () => {} };
const SessionContext = createContext<SessionState>(anonymousSession);

export function MarketplaceSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const session = await getSession();
      setEmail(session.data.user.email);
      setFavorites(new Set(await getFavorites()));
    } catch (cause) {
      if (!(cause instanceof ApiError && cause.status === 401)) {
        console.error("Marketplace session load failed", cause);
        setError("Account services are temporarily unavailable.");
      }
      setEmail(null); setFavorites(new Set());
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
  const value = useMemo(() => ({ loading, email, error, isFavorite: (slug: string) => favorites.has(slug), toggleFavorite, refresh }), [loading, email, error, favorites, toggleFavorite, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useMarketplaceSession() { return useContext(SessionContext); }
