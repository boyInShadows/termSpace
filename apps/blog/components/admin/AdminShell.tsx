"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
const adminLinks = [
  { href: "/admin", label: "Articles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/articles/new", label: "New article" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/editions", label: "Editions" },
  { href: "/admin/taxonomy", label: "Tags & series" },
  { href: "/admin/comments", label: "Comments" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const currentHref = pathname.startsWith("/admin/articles/") && pathname !== "/admin/articles/new" ? "/admin" : pathname;
  if (pathname === "/admin/login") return <>{children}</>;
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">Studio · English</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-ink-soft hover:text-accent">
              ← View site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2 border-b border-line pb-2" aria-label="Admin">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentHref === link.href ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-md px-3 py-1.5 text-sm hover:bg-paper-warm hover:text-ink ${currentHref === link.href ? "bg-paper-warm font-semibold text-ink" : "text-ink-soft"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
