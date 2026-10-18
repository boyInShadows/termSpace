"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Copy, ExternalLink, ShieldCheck, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { copyToClipboard } from "@/components/patterns/copy-block";
import { intlLocale } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";
import type { MarketplaceInstallation } from "@/lib/types";

/** Loaded only once a reader opens their installation, so it stays out of the page's first-load JS. */
export function InstallDialogContent({ installation }: { installation: MarketplaceInstallation }) {
  const { fa, locale } = useLocale();
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);
  const copy = fa ? {
    title: "نصب نسخهٔ دریافت‌شده", intro: "این اطلاعات به همان نسخه‌ای متصل است که به کتابخانهٔ شما افزوده شد.", close: "بستن",
    exactVersion: "نسخهٔ دقیق", sourceStatus: "وضعیت منبع", immutableRef: "مرجع تغییرناپذیر", checked: "آخرین بررسی",
    stale: "بررسی ارائه‌دهنده موقتاً قدیمی است؛ آخرین مرجع تأییدشده بدون تغییر باقی مانده است.", steps: "مراحل نصب",
    openPackage: "باز کردن بستهٔ تأییدشده", copyUrl: "کپی پیوند", copied: "پیوند کپی شد.", failed: "کپی خودکار انجام نشد. متن را انتخاب کنید و Ctrl+C را بزنید.",
  } : {
    title: "Install acquired release", intro: "These details are pinned to the exact version added to your library.", close: "Close",
    exactVersion: "Exact version", sourceStatus: "Source status", immutableRef: "Immutable reference", checked: "Last checked",
    stale: "The provider check is temporarily stale; the last verified reference remains unchanged.", steps: "Installation steps",
    openPackage: "Open verified package", copyUrl: "Copy link", copied: "Link copied.", failed: "Couldn’t copy automatically. Select the text and press Ctrl+C.",
  };
  const { release } = installation;
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(94vw,48rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-lift">
        <div className="flex items-start justify-between gap-5">
          <div>
            <Dialog.Title className="editorial text-3xl">{copy.title}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">{copy.intro}</Dialog.Description>
          </div>
          <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button></Dialog.Close>
        </div>
        <div className="mt-6 grid gap-3 rounded-xl border bg-surface p-4 text-sm sm:grid-cols-2">
          <InstallFact label={copy.exactVersion} value={`v${release.version}`} />
          <InstallFact label={copy.sourceStatus} value={release.source.status} />
          <InstallFact label={copy.immutableRef} value={release.source.ref} mono />
          <InstallFact label={copy.checked} value={release.source.checkedAt ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(release.source.checkedAt)) : "—"} />
        </div>
        {release.source.status === "stale" && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">{copy.stale}</p>}
        <div className="mt-6">
          <p className="eyebrow">{copy.steps}</p>
          <ol className="mt-3 space-y-3">
            {release.installation.instructions.map((step, index) => (
              <li className="flex gap-3 text-sm" key={`${index}-${step}`}><span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>
            ))}
          </ol>
        </div>
        <div className="mt-6 rounded-lg bg-foreground p-4 text-background">
          <div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="size-4" />{release.installation.method} · {release.source.kind}</div>
          <p className="mt-3 break-all font-mono text-xs text-background/75" dir="ltr">{release.installation.url}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a className={buttonVariants({ size: "sm", variant: "secondary" })} href={release.installation.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{copy.openPackage}</a>
            <Button size="sm" variant="secondary" onClick={() => void copyToClipboard(release.installation.url).then((ok) => setStatus(ok ? "copied" : "failed"))}><Copy className="size-4" />{copy.copyUrl}</Button>
          </div>
          <p role="status" className="mt-2 min-h-4 text-xs text-background/75">{status === "copied" ? copy.copied : status === "failed" ? copy.failed : ""}</p>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function InstallFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1 font-medium"} dir={mono ? "ltr" : undefined}>{value}</p></div>;
}
