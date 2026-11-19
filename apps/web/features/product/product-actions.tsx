"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Download, Eye, Heart, LibraryBig } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
    install: "نصب", installVersion: "نصب نسخهٔ {version}",
    inLibrary: "در کتابخانهٔ شما", inLibraryVersion: "در کتابخانهٔ شما · نسخهٔ {version}",
    noReleaseTitle: "هنوز نسخه‌ای برای نصب نیست", noReleaseBody: "سازنده هنوز نسخهٔ تأییدشده‌ای منتشر نکرده است. همچنان می‌توانید پیش‌نمایش را ببینید و آن را ذخیره کنید.",
    gone: "این نسخه دیگر برای افزودن در دسترس نیست.", held: "این منبع از قبل در کتابخانهٔ شما هست.", signInAgain: "نشست شما پایان یافته است. برای افزودن دوباره وارد شوید.",
    busy: "درخواست‌ها بیش از حد است. کمی صبر کنید و دوباره تلاش کنید.", signedOut: "برای افزودن به کتابخانه یا ذخیره، وارد حساب خود شوید.",
    addVersion: "افزودن نسخهٔ {version} به کتابخانه", loadingRelease: "در حال بارگذاری نسخه…", releaseFailed: "این نسخه بارگذاری نشد.",
  } : {
    added: "Added to your library.", failed: "Could not add this resource. Check your connection and try again.", adding: "Adding…", add: "Add to library",
    preview: "Preview",
    saved: "Saved", save: "Save",
    install: "Install", installVersion: "Install v{version}",
    inLibrary: "In your library", inLibraryVersion: "In your library · v{version}",
    noReleaseTitle: "No release to install yet", noReleaseBody: "The creator hasn’t published an approved release. You can still preview this listing and save it.",
    gone: "This release is no longer available to add.", held: "This resource is already in your library.", signInAgain: "Your session has ended. Log in again to add this.",
    busy: "Too many requests. Wait a minute and try again.", signedOut: "Log in to add this to your library or save it.",
    addVersion: "Add v{version} to library", loadingRelease: "Loading release…", releaseFailed: "Couldn’t load this release.",
  };
  const session = useMarketplaceSession();
  const router = useRouter();
  const selection = useReleaseSelection();
  const version = selection?.selected?.version ?? product.release?.version;
  // Installing needs no account: the dialog shows the public release the visitor is inspecting.
  const release = selection ? (selection.state.status === "ready" ? selection.state.release : null) : product.release;
  const saved = session.isFavorite(product.slug);
  const [message, setMessage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  // The signed-in reader's library entry, keyed by account so a sign-out or account switch never shows
  // another reader's entry. `release` is their pinned acquisition, or null when it is held but withheld.
  const [library, setLibrary] = useState<{ email: string; release: MarketplaceInstallation["release"] | null } | null>(null);
  const held = library && library.email === session.email ? library : null;
  // The triggers stay outside the lazy dialogs; each dialog restores their focus.
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const installTrigger = useRef<HTMLButtonElement>(null);
  const acquisitionKey = useRef<{ version: string | undefined; key: string } | null>(null);
  useEffect(() => {
    const email = session.email;
    if (session.loading || !email) return;
    const controller = new AbortController();
    void getProductInstallation(product.slug, controller.signal)
      .then((result) => setLibrary({ email, release: result.release }))
      .catch((cause) => {
        if (controller.signal.aborted || (cause instanceof ApiError && cause.code === "ACQUISITION_NOT_FOUND")) return;
        // Restricted since it was added: still in the library, but its release is withheld.
        if (cause instanceof ApiError && cause.code === "INSTALLATION_UNAVAILABLE") { setLibrary({ email, release: null }); return; }
        console.error("Library entry could not be loaded", cause);
      });
    return () => controller.abort();
  }, [product.slug, session.email, session.loading]);
  async function refreshLibrary(email: string) {
    try {
      setLibrary({ email, release: (await getProductInstallation(product.slug)).release });
    } catch (cause) {
      setLibrary({ email, release: null });
      if (!(cause instanceof ApiError && cause.code === "INSTALLATION_UNAVAILABLE")) console.error("Library entry could not be loaded", cause);
    }
  }
  // A reader opening a listing they hold sees, and installs, the version in their library, until
  // they pick another one in the picker.
  const heldVersion = held?.release?.version;
  const switchedToHeld = useRef(false);
  useEffect(() => {
    if (!selection || !heldVersion || switchedToHeld.current || !selection.isCurrent) return;
    switchedToHeld.current = true;
    const entry = selection.versions.find((item) => item.version === heldVersion);
    if (entry && entry.id !== selection.selected?.id) selection.select(entry.id);
  }, [heldVersion, selection]);
  async function acquire() {
    const email = session.email;
    if (!email) { router.push(`${localePath("/account", locale)}?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setAdding(true); setMessage(null);
    const attempt = acquisitionKey.current && acquisitionKey.current.version === version ? acquisitionKey.current : (acquisitionKey.current = { version, key: crypto.randomUUID() });
    try {
      await acquireProduct(product.slug, attempt.key, version);
      setMessage(copy.added); acquisitionKey.current = null;
      await refreshLibrary(email);
    }
    catch (cause) {
      const known = cause instanceof ApiError ? cause : null;
      if (known?.code === "ALREADY_IN_LIBRARY") void refreshLibrary(email);
      // The release can be withdrawn between page render and click.
      setMessage(known?.code === "RELEASE_UNAVAILABLE" ? copy.gone : known?.code === "ALREADY_IN_LIBRARY" ? copy.held : known?.status === 401 ? copy.signInAgain : known?.status === 429 ? copy.busy : copy.failed);
      console.error("Resource library add failed", cause);
    }
    finally { setAdding(false); }
  }
  // The API refuses to acquire a listing without an approved release; say so before the click.
  const status = selection ? selection.state.status : product.release ? "ready" : "none";
  const loadingRelease = status === "loading" || status === "error";
  // The pinned library release installs while it is the version being inspected, or when the listing
  // has no public release left to inspect. Any other version installs its own public release.
  const pinned = held?.release && (held.release.version === version || status === "none") ? held.release : null;
  const installRelease = pinned ?? release;
  const installVersion = installRelease?.version ?? version;
  return (
    <div className="space-y-3">
      {status === "none" && !pinned ? (
        <div role="status" className="text-sm">
          <p className="font-semibold text-foreground">{copy.noReleaseTitle}</p>
          <p className="mt-1 leading-6 text-muted-foreground">{copy.noReleaseBody}</p>
        </div>
      ) : <>
        <Button ref={installTrigger} size="lg" className="w-full" aria-haspopup="dialog" aria-expanded={installOpen} disabled={!installRelease} onClick={() => setInstallOpen(true)}>
          <Download size={18} />
          {loadingRelease && !pinned ? (status === "error" ? copy.releaseFailed : copy.loadingRelease) : installVersion ? copy.installVersion.replace("{version}", installVersion) : copy.install}
        </Button>
        {held
          ? <Link className={`${buttonVariants({ variant: "secondary" })} w-full`} href={localePath("/dashboard/library", locale)}>
            <Check size={17} />
            {held.release ? copy.inLibraryVersion.replace("{version}", held.release.version) : copy.inLibrary}
          </Link>
          : <Button variant="secondary" className="w-full" disabled={adding || loadingRelease} onClick={() => void acquire()}>
            <LibraryBig size={17} />
            {adding ? copy.adding : version ? copy.addVersion.replace("{version}", version) : copy.add}
          </Button>}
      </>}
      {installOpen && installRelease && <Suspense fallback={null}><InstallDialogContent release={installRelease} acquired={Boolean(pinned)} onOpenChange={setInstallOpen} trigger={installTrigger} /></Suspense>}
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
