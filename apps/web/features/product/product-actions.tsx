"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Eye,
  Heart,
  LibraryBig,
  X,
  FileText,
  Folder,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { MarketplaceInstallation, ProductDetail } from "@/lib/types";
import { acquireProduct, ApiError, getProductInstallation } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
export function ProductActions({ product }: { product: ProductDetail }) {
  const { fa } = useLocale();
  const copy = fa ? {
    added: "به کتابخانهٔ شما افزوده شد.", failed: "افزودن منبع انجام نشد. دوباره تلاش کنید.", adding: "در حال افزودن…", add: "افزودن به کتابخانه",
    preview: "پیش‌نمایش", inside: "محتوای", previewDescription: "پیش‌نمایش فقط‌خواندنی ساختار بسته و یک نمونه.", close: "بستن پیش‌نمایش",
    excerpt: "بخشی از SKILL.md", unavailable: "برای این منبع پیش‌نمایشی وجود ندارد.", copyExcerpt: "کپی بخش نمونه", saved: "ذخیره‌شده", save: "ذخیره",
    free: "منبع رایگان جامعه", license: "جزئیات مجوز در بالا",
    viewInstall: "مشاهدهٔ نصب", installTitle: "نصب نسخهٔ دریافت‌شده", installIntro: "این اطلاعات به همان نسخه‌ای متصل است که به کتابخانهٔ شما افزوده شد.",
    installUnavailable: "نصب این نسخه اکنون در دسترس نیست.", sourceStatus: "وضعیت منبع", checked: "آخرین بررسی", immutableRef: "مرجع تغییرناپذیر",
    openPackage: "باز کردن بستهٔ تأییدشده", copyUrl: "کپی پیوند", copied: "پیوند کپی شد.", steps: "مراحل نصب", exactVersion: "نسخهٔ دقیق",
    stale: "بررسی ارائه‌دهنده موقتاً قدیمی است؛ آخرین مرجع تأییدشده بدون تغییر باقی مانده است.",
  } : {
    added: "Added to your library.", failed: "Could not add this resource. Please try again.", adding: "Adding…", add: "Add to library",
    preview: "Preview", inside: "Inside", previewDescription: "A read-only preview of the package structure and one example.", close: "Close preview",
    excerpt: "Excerpt · SKILL.md", unavailable: "No preview is available for this resource.", copyExcerpt: "Copy excerpt", saved: "Saved", save: "Save",
    free: "Free community resource", license: "License details above",
    viewInstall: "View installation", installTitle: "Install acquired release", installIntro: "These details are pinned to the exact version added to your library.",
    installUnavailable: "Installation for this release is currently unavailable.", sourceStatus: "Source status", checked: "Last checked", immutableRef: "Immutable reference",
    openPackage: "Open verified package", copyUrl: "Copy link", copied: "Link copied.", steps: "Installation steps", exactVersion: "Exact version",
    stale: "The provider check is temporarily stale; the last verified reference remains unchanged.",
  };
  const session = useMarketplaceSession();
  const router = useRouter();
  const saved = session.isFavorite(product.slug);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [installation, setInstallation] = useState<MarketplaceInstallation | null>(null);
  const [installationBlocked, setInstallationBlocked] = useState(false);
  const [installationOpen, setInstallationOpen] = useState(false);
  const acquisitionKey = useRef<string | null>(null);
  useEffect(() => {
    if (session.loading || !session.email) return;
    const controller = new AbortController();
    void getProductInstallation(product.slug, controller.signal)
      .then((result) => { setInstallation(result); setInstallationBlocked(false); })
      .catch((cause) => {
        if (controller.signal.aborted || (cause instanceof ApiError && cause.status === 404)) return;
        if (cause instanceof ApiError && cause.code === "INSTALLATION_UNAVAILABLE") setInstallationBlocked(true);
      });
    return () => controller.abort();
  }, [product.slug, session.email, session.loading]);
  async function acquire() {
    if (!session.email) { router.push(`/account?next=${encodeURIComponent(window.location.pathname)}`); return; }
    if (installation) { setInstallationOpen(true); return; }
    setAdding(true); setMessage(null);
    acquisitionKey.current ??= crypto.randomUUID();
    try {
      await acquireProduct(product.slug, acquisitionKey.current);
      const details = await getProductInstallation(product.slug);
      setInstallation(details); setInstallationBlocked(false); setInstallationOpen(true); setMessage(copy.added); acquisitionKey.current = null;
    }
    catch (cause) { setMessage(copy.failed); console.error("Resource library add failed", cause); }
    finally { setAdding(false); }
  }
  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" disabled={adding || installationBlocked} onClick={() => void acquire()}>
        {installation ? <Download size={18} /> : <LibraryBig size={18} />}
        {adding ? copy.adding : installationBlocked ? copy.installUnavailable : installation ? copy.viewInstall : copy.add}
      </Button>
      <Dialog.Root open={installationOpen} onOpenChange={setInstallationOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
          {installation && <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(94vw,48rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-lift">
            <div className="flex items-start justify-between gap-5"><div><Dialog.Title className="editorial text-3xl">{copy.installTitle}</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">{copy.installIntro}</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button></Dialog.Close></div>
            <div className="mt-6 grid gap-3 rounded-xl border bg-surface p-4 text-sm sm:grid-cols-2">
              <InstallFact label={copy.exactVersion} value={`v${installation.release.version}`} />
              <InstallFact label={copy.sourceStatus} value={installation.release.source.status} />
              <InstallFact label={copy.immutableRef} value={installation.release.source.ref} mono />
              <InstallFact label={copy.checked} value={installation.release.source.checkedAt ? new Intl.DateTimeFormat(fa ? "fa-IR" : "en-US", { dateStyle: "medium" }).format(new Date(installation.release.source.checkedAt)) : "—"} />
            </div>
            {installation.release.source.status === "stale" && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">{copy.stale}</p>}
            <div className="mt-6"><p className="eyebrow">{copy.steps}</p><ol className="mt-3 space-y-3">{installation.release.installation.instructions.map((step, index) => <li className="flex gap-3 text-sm" key={`${index}-${step}`}><span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}</ol></div>
            <div className="mt-6 rounded-lg bg-foreground p-4 text-background"><div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="size-4" />{installation.release.installation.method} · {installation.release.source.kind}</div><p className="mt-3 break-all font-mono text-xs text-background/75" dir="ltr">{installation.release.installation.url}</p><div className="mt-4 flex flex-wrap gap-2"><a className={buttonVariants({ size: "sm", variant: "secondary" })} href={installation.release.installation.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{copy.openPackage}</a><Button size="sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(installation.release.installation.url); setMessage(copy.copied); }}><Copy className="size-4" />{copy.copyUrl}</Button></div></div>
          </Dialog.Content>}
        </Dialog.Portal>
      </Dialog.Root>
      <div className="grid grid-cols-2 gap-2">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Eye size={17} />
              {copy.preview}
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <Dialog.Title className="editorial text-3xl">
                    {copy.inside} {product.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {copy.previewDescription}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={copy.close}
                  >
                    <X />
                  </Button>
                </Dialog.Close>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-[13rem_1fr]">
                <div className="rounded-lg bg-muted p-4 font-mono text-xs">
                  <p className="flex gap-2 font-semibold">
                    <Folder size={14} />
                    {product.slug}/
                  </p>
                  {product.previewFiles.map((f) => (
                    <p className="mt-3 flex gap-2 ps-4" key={f}>
                      <FileText size={13} />
                      {f}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="eyebrow">{copy.excerpt}</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border bg-surface p-4 font-mono text-xs leading-6 text-muted-foreground">{product.previewExcerpt ?? copy.unavailable}</pre>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => void navigator.clipboard.writeText(product.previewExcerpt ?? "")} disabled={!product.previewExcerpt}>
                    <Copy size={14} />
                    {copy.copyExcerpt}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Button
          variant="secondary"
          aria-pressed={saved}
          onClick={() => void session.toggleFavorite(product.slug)}
        >
          <Heart
            size={17}
            className={saved ? "fill-primary text-primary" : ""}
          />
          {saved ? copy.saved : copy.save}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {copy.free} · {product.license ?? copy.license}
      </p>
      {message && <p role="status" className="text-center text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

function InstallFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1 font-medium"} dir={mono ? "ltr" : undefined}>{value}</p></div>;
}
