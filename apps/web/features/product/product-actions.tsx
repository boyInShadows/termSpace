"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
    added: "به کتابخانهٔ شما افزوده شد.", failed: "افزودن منبع انجام نشد. اتصال خود را بررسی کنید و دوباره تلاش کنید.", adding: "در حال افزودن…", add: "افزودن به کتابخانه",
    preview: "پیش‌نمایش",
    saved: "ذخیره‌شده", save: "ذخیره",
    viewInstall: "مشاهدهٔ نصب",
    installUnavailable: "نصب این نسخه اکنون در دسترس نیست.",
    noReleaseTitle: "هنوز نسخه‌ای برای افزودن نیست", noReleaseBody: "سازنده هنوز نسخهٔ تأییدشده‌ای منتشر نکرده است. همچنان می‌توانید پیش‌نمایش را ببینید و آن را ذخیره کنید.",
    gone: "این نسخه دیگر برای افزودن در دسترس نیست.", held: "این منبع از قبل در کتابخانهٔ شما هست.", signInAgain: "نشست شما پایان یافته است. برای افزودن دوباره وارد شوید.",
    busy: "درخواست‌ها بیش از حد است. کمی صبر کنید و دوباره تلاش کنید.", signedOut: "برای افزودن یا ذخیره، وارد حساب خود شوید.",
    addVersion: "افزودن نسخهٔ {version} به کتابخانه", loadingRelease: "در حال بارگذاری نسخه…", releaseFailed: "این نسخه بارگذاری نشد.",
  } : {
    added: "Added to your library.", failed: "Could not add this resource. Check your connection and try again.", adding: "Adding…", add: "Add to library",
    preview: "Preview",
    saved: "Saved", save: "Save",
    viewInstall: "View installation",
    installUnavailable: "Installation for this release is currently unavailable.",
    noReleaseTitle: "No release to add yet", noReleaseBody: "The creator hasn’t published an approved release. You can still preview this listing and save it.",
    gone: "This release is no longer available to add.", held: "This resource is already in your library.", signInAgain: "Your session has ended. Sign in again to add this.",
    busy: "Too many requests. Wait a minute and try again.", signedOut: "Sign in to add or save this listing.",
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
  // The triggers stay outside the lazy dialogs; each dialog restores their focus.
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const installationTrigger = useRef<HTMLButtonElement>(null);
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
      const known = cause instanceof ApiError ? cause : null;
      if (known?.code === "ALREADY_IN_LIBRARY") void getProductInstallation(product.slug).then(setInstallation).catch(() => undefined);
      // The release can be withdrawn between page render and click.
      setMessage(known?.code === "RELEASE_UNAVAILABLE" ? copy.gone : known?.code === "ALREADY_IN_LIBRARY" ? copy.held : known?.status === 401 ? copy.signInAgain : known?.status === 429 ? copy.busy : copy.failed);
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
      {noRelease ? (
        <div role="status" className="text-sm">
          <p className="font-semibold text-foreground">{copy.noReleaseTitle}</p>
          <p className="mt-1 leading-6 text-muted-foreground">{copy.noReleaseBody}</p>
        </div>
      ) : (
        <Button ref={installationTrigger} size="lg" className="w-full" aria-haspopup={session.email ? "dialog" : undefined} aria-expanded={session.email ? installationOpen : undefined} disabled={adding || installationBlocked || loadingRelease} onClick={() => void acquire()}>
          {installation ? <Download size={18} /> : <LibraryBig size={18} />}
          {adding ? copy.adding : installationBlocked ? copy.installUnavailable : loadingRelease ? (status === "error" ? copy.releaseFailed : copy.loadingRelease) : installation ? copy.viewInstall : version ? copy.addVersion.replace("{version}", version) : copy.add}
        </Button>
      )}
      {installationOpen && installation && <Suspense fallback={null}><InstallDialogContent installation={installation} onOpenChange={setInstallationOpen} trigger={installationTrigger} /></Suspense>}
      <div className="grid grid-cols-2 gap-2">
        <Button ref={previewTrigger} variant="secondary" aria-haspopup="dialog" aria-expanded={previewOpen} onClick={() => setPreviewOpen(true)}>
          <Eye size={17} />
          {copy.preview}
        </Button>
        {previewOpen && <Suspense fallback={null}><PreviewDialogContent product={product} onOpenChange={setPreviewOpen} trigger={previewTrigger} /></Suspense>}
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
      {!session.loading && !session.email && <p className="text-xs text-muted-foreground">{copy.signedOut}</p>}
      {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
