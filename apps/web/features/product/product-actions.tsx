"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Eye, Heart, LibraryBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MarketplaceInstallation, ProductDetail } from "@/lib/types";
import { acquireProduct, ApiError, getProductInstallation } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { useReleaseSelection } from "./release-selection";

const PreviewDialogContent = lazy(() => import("./preview-dialog").then((module) => ({ default: module.PreviewDialogContent })));
const InstallDialogContent = lazy(() => import("./install-dialog").then((module) => ({ default: module.InstallDialogContent })));

export function ProductActions({ product }: { product: ProductDetail }) {
  const { fa, locale } = useLocale();
  const copy = fa ? {
    added: "به کتابخانهٔ شما افزوده شد.", failed: "افزودن منبع انجام نشد. دوباره تلاش کنید.", adding: "در حال افزودن…", add: "افزودن به کتابخانه",
    preview: "پیش‌نمایش",
    saved: "ذخیره‌شده", save: "ذخیره",
    free: "منبع رایگان جامعه", license: "جزئیات مجوز در بالا",
    viewInstall: "مشاهدهٔ نصب",
    installUnavailable: "نصب این نسخه اکنون در دسترس نیست.",
    noRelease: "هنوز نسخهٔ تأییدشده‌ای برای دریافت وجود ندارد.",
    addVersion: "افزودن نسخهٔ {version} به کتابخانه", loadingRelease: "در حال بارگذاری نسخه…", releaseFailed: "این نسخه بارگذاری نشد.",
  } : {
    added: "Added to your library.", failed: "Could not add this resource. Please try again.", adding: "Adding…", add: "Add to library",
    preview: "Preview",
    saved: "Saved", save: "Save",
    free: "Free community resource", license: "License details above",
    viewInstall: "View installation",
    installUnavailable: "Installation for this release is currently unavailable.",
    noRelease: "No approved release is available yet.",
    addVersion: "Add v{version} to library", loadingRelease: "Loading release…", releaseFailed: "Couldn’t load this release.",
  };
  const session = useMarketplaceSession();
  const router = useRouter();
  const selection = useReleaseSelection();
  const version = selection?.selected?.version ?? product.release?.version;
  const saved = session.isFavorite(product.slug);
  const [message, setMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [installation, setInstallation] = useState<MarketplaceInstallation | null>(null);
  const [installationBlocked, setInstallationBlocked] = useState(false);
  const [installationOpen, setInstallationOpen] = useState(false);
  const acquisitionKey = useRef<{ version: string | undefined; key: string } | null>(null);
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
    if (!session.email) { router.push(`${localePath("/account", locale)}?next=${encodeURIComponent(window.location.pathname)}`); return; }
    if (installation) { setInstallationOpen(true); return; }
    setAdding(true); setMessage(null);
    const attempt = acquisitionKey.current && acquisitionKey.current.version === version ? acquisitionKey.current : (acquisitionKey.current = { version, key: crypto.randomUUID() });
    try {
      await acquireProduct(product.slug, attempt.key, version);
      const details = await getProductInstallation(product.slug);
      setInstallation(details); setInstallationBlocked(false); setInstallationOpen(true); setMessage(copy.added); acquisitionKey.current = null;
    }
    catch (cause) {
      // The release can be withdrawn between page render and click.
      setMessage(cause instanceof ApiError && cause.code === "RELEASE_UNAVAILABLE" ? copy.noRelease : copy.failed);
      console.error("Resource library add failed", cause);
    }
    finally { setAdding(false); }
  }
  // The API refuses to acquire a listing without an approved release; say so before the click.
  const status = selection ? selection.state.status : product.release ? "ready" : "none";
  const noRelease = status === "none" && !installation;
  const loadingRelease = (status === "loading" || status === "error") && !installation;
  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" disabled={adding || installationBlocked || noRelease || loadingRelease} onClick={() => void acquire()}>
        {installation ? <Download size={18} /> : <LibraryBig size={18} />}
        {adding ? copy.adding : installationBlocked ? copy.installUnavailable : noRelease ? copy.noRelease : loadingRelease ? (status === "error" ? copy.releaseFailed : copy.loadingRelease) : installation ? copy.viewInstall : version ? copy.addVersion.replace("{version}", version) : copy.add}
      </Button>
      <Dialog.Root open={installationOpen} onOpenChange={setInstallationOpen}>
        {installationOpen && installation && <Suspense fallback={null}><InstallDialogContent installation={installation} /></Suspense>}
      </Dialog.Root>
      <div className="grid grid-cols-2 gap-2">
        <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Eye size={17} />
              {copy.preview}
            </Button>
          </Dialog.Trigger>
          {previewOpen && <Suspense fallback={null}><PreviewDialogContent product={product} /></Suspense>}
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
