"use client";

import { useEffect } from "react";
import { request } from "@/lib/api";

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `termspace:view:${slug}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void request(`/api/marketplace/products/${encodeURIComponent(slug)}/view`, { method: "POST" }).catch(() => sessionStorage.removeItem(key));
  }, [slug]);
  return null;
}
