import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const next = query?.next?.startsWith("/admin") ? query.next : "/admin";

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-md place-items-center px-6 py-16">
      <div className="w-full rounded-xl border border-line bg-paper-card p-6">
        <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">Studio</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-3 text-sm text-ink-soft">
          The editorial workspace is available in English. Sign in with your administrator email and password.
        </p>
        <AdminLoginForm next={next} />
      </div>
    </div>
  );
}
