"use client";

import { useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CopyBlock } from "@/components/patterns/copy-block";
import { intlLocale } from "@/lib/format";
import { useLocale } from "@/lib/locale-context";
import type { InstallCommand, ProductRelease } from "@/lib/types";

const OS_ORDER: InstallCommand["os"][] = ["macos", "linux", "windows", "any"];

/** The reader's own system, so the matching group opens first. Runs only after the reader opened the dialog, never during SSR. */
function detectOs(): InstallCommand["os"] | null {
  const agent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Windows/i.test(agent)) return "windows";
  if (/Android/i.test(agent)) return null;
  if (/Mac|iPhone|iPad/i.test(agent)) return "macos";
  if (/Linux|X11/i.test(agent)) return "linux";
  return null;
}

/** Commands grouped by operating system; one toggle per system that has any, the reader's own pre-selected. */
function InstallCommands({ commands, copy }: { commands: InstallCommand[]; copy: Record<string, string> }) {
  const present = OS_ORDER.filter((os) => commands.some((command) => command.os === os));
  const [selected, setSelected] = useState(() => {
    const own = detectOs();
    return own && present.includes(own) ? own : present[0];
  });
  const shown = commands.filter((command) => command.os === selected);
  return (
    <div className="mt-6">
      <p className="eyebrow">{copy.commands}</p>
      {present.length > 1 && (
        <div role="group" aria-label={copy.system} className="mt-3 flex flex-wrap gap-2">
          {present.map((os) => (
            <Button key={os} type="button" size="sm" variant={os === selected ? "primary" : "secondary"} aria-pressed={os === selected} onClick={() => setSelected(os)}>{copy[`os_${os}`]}</Button>
          ))}
        </div>
      )}
      <div className="mt-3 space-y-3">
        {shown.map((item, index) => (
          <CopyBlock key={`${selected}-${index}`} label={item.label ?? copy[`os_${item.os}`]} text={item.command} copyLabel={copy.copyCommand} copiedLabel={copy.commandCopied} failedLabel={copy.failed} wrap />
        ))}
      </div>
    </div>
  );
}

/** The parts of a release the dialog shows. */
export type InstallableRelease = Pick<ProductRelease, "version" | "source" | "installation">;

/** Loaded only once a visitor opens it, so it stays out of the page's first-load JS. Needs no account. */
export function InstallDialogContent({ release, acquired = false, onOpenChange, trigger }: {
  release: InstallableRelease;
  /** The reader's pinned library release rather than the one shown on the page. */
  acquired?: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  const { fa, locale } = useLocale();
  const copy = fa ? {
    title: acquired ? "نصب نسخهٔ دریافت‌شده" : "نصب این نسخه",
    intro: acquired ? "این اطلاعات به همان نسخه‌ای متصل است که به کتابخانهٔ شما افزوده شد." : "این اطلاعات به همان نسخه و منبعی تعلق دارد که در این صفحه می‌بینید.", close: "بستن",
    exactVersion: "نسخهٔ دقیق", sourceStatus: "وضعیت منبع", immutableRef: "مرجع تغییرناپذیر", checked: "آخرین بررسی",
    linkOnly: "این نسخه فقط یک پیوند است. مالکیت تأیید نشده و محتوا ممکن است پس از بررسی تغییر کرده باشد.",
    stale: "بررسی ارائه‌دهنده موقتاً قدیمی است؛ آخرین مرجع تأییدشده بدون تغییر باقی مانده است.", steps: "مراحل نصب",
    commands: "دستورهای نصب", system: "سیستم‌عامل", os_macos: "macOS", os_linux: "لینوکس", os_windows: "ویندوز", os_any: "هر سیستم",
    copyCommand: "کپی", commandCopied: "کپی شد",
    openPackage: "باز کردن بستهٔ تأییدشده", copyUrl: "کپی", copied: "کپی شد", sourceLink: "پیوند منبع", statusLinkOnly: "فقط پیوند", statusStale: "قدیمی", statusVerified: "تأییدشده", failed: "کپی خودکار انجام نشد. متن را انتخاب کنید و Ctrl+C را بزنید.",
  } : {
    title: acquired ? "Install acquired release" : "Install this release",
    intro: acquired ? "These details are pinned to the exact version added to your library." : "These details belong to the exact version and source shown on this page.", close: "Close",
    exactVersion: "Exact version", sourceStatus: "Source status", immutableRef: "Immutable reference", checked: "Last checked",
    linkOnly: "This release is a plain link. Ownership is not verified, and the content may have changed since review.",
    stale: "The provider check is temporarily stale; the last verified reference remains unchanged.", steps: "Installation steps",
    commands: "Install commands", system: "Operating system", os_macos: "macOS", os_linux: "Linux", os_windows: "Windows", os_any: "Any system",
    copyCommand: "Copy", commandCopied: "Copied",
    openPackage: "Open verified package", copyUrl: "Copy", copied: "Copied", sourceLink: "Source link", statusLinkOnly: "Link only", statusStale: "Stale", statusVerified: "Verified", failed: "Couldn’t copy automatically. Select the text and press Ctrl+C.",
  };
  const sourceStatus = release.source.status === "link_only" ? copy.statusLinkOnly : release.source.status === "stale" ? copy.statusStale : copy.statusVerified;
  const notice = release.source.status === "link_only" ? copy.linkOnly : release.source.status === "stale" ? copy.stale : null;
  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
        <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }} className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(94vw,48rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-border bg-background p-6 shadow-panel">
          <div className="flex items-start justify-between gap-5">
            <div>
              <Dialog.Title className="editorial text-3xl">{copy.title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">{copy.intro}</Dialog.Description>
            </div>
            <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button></Dialog.Close>
          </div>
          <div className="mt-6 grid gap-3 rounded-card border border-border bg-surface p-4 text-sm sm:grid-cols-2">
            <InstallFact label={copy.exactVersion} value={`v${release.version}`} />
            <InstallFact label={copy.sourceStatus} value={sourceStatus} />
            {release.source.kind !== "external_link" && <InstallFact label={copy.immutableRef} value={release.source.ref} mono />}
            <InstallFact label={copy.checked} value={release.source.checkedAt ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(release.source.checkedAt)) : "—"} />
          </div>
          {notice && <p role="note" className="mt-4 rounded-control border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">{notice}</p>}
          {release.installation.commands && release.installation.commands.length > 0 && <InstallCommands commands={release.installation.commands} copy={copy} />}
          {release.installation.instructions.length > 0 && <div className="mt-6">
            <p className="eyebrow">{copy.steps}</p>
            <ol className="mt-3 space-y-3">
              {release.installation.instructions.map((step, index) => (
                <li className="flex gap-3 text-sm" key={`${index}-${step}`}><span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span><span className="ts-bidi min-w-0 break-words">{step}</span></li>
              ))}
            </ol>
          </div>}
          <div className="mt-6">
            <CopyBlock label={`${copy.sourceLink} · ${release.installation.method} · ${release.source.kind}`} text={release.installation.url} copyLabel={copy.copyUrl} copiedLabel={copy.copied} failedLabel={copy.failed} wrap />
            <a className={`${buttonVariants({ size: "sm", variant: "secondary" })} mt-1`} href={release.installation.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" />{copy.openPackage}</a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function InstallFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1 font-medium"} dir={mono ? "ltr" : undefined}>{value}</p></div>;
}
