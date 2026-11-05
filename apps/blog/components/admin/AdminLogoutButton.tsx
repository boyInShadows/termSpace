"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await api.logoutAdmin();
      router.replace("/admin/login");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign out. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span><button type="button" onClick={logout} disabled={busy} className="text-sm text-ink-soft hover:text-accent disabled:opacity-50">
      {busy ? "Signing out…" : "Sign out"}
    </button>{error && <span role="alert" className="block text-sm text-red-700">{error}</span>}</span>
  );
}
