import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const adminLinks = [
  { href: "/admin", label: "Articles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/articles/new", label: "New article" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/editions", label: "Editions" },
  { href: "/admin/taxonomy", label: "Tags & series" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/newsletter", label: "Newsletter" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">Studio</p>
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
              className="rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-warm hover:text-ink"
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
