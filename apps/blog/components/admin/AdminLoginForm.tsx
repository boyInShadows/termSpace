"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AdminLoginFormProps {
  next: string;
}

export function AdminLoginForm({ next }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    setChecking(true);
    setError("");

    try {
      await api.loginAdmin(normalizedEmail, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-ink-soft">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-2.5 text-ink focus:border-accent"
          autoComplete="username"
          aria-invalid={Boolean(error)}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-ink-soft">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line-input bg-paper-card px-4 py-2.5 text-ink focus:border-accent"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
        />
      </div>

      <button
        type="submit"
        disabled={checking}
        className="w-full rounded-lg bg-accent px-6 py-3 font-medium text-paper hover:bg-accent-soft disabled:opacity-50"
      >
        {checking ? "Checking..." : "Continue"}
      </button>
    </form>
  );
}
