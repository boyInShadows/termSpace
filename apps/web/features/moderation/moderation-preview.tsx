"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, RotateCcw, ShieldAlert } from "lucide-react";
import { addModerationNote, ApiError, getModerationPreview, moderateListing } from "@/lib/api";
import type { MarketplaceModerationPreview } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Manifest = { listing?: Record<string, unknown>; release?: Record<string, unknown>; typeDetails?: Record<string, unknown> };
type Action = "APPROVE" | "PUBLISH" | "REQUEST_CHANGES" | "REJECT" | "SUSPEND" | "REINSTATE" | "ARCHIVE" | "RESTORE";

export function ModerationPreview({ productId }: { productId: string }) {
  const { locale, t } = useLocale();
  const session = useMarketplaceSession();
  const [preview, setPreview] = useState<MarketplaceModerationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const canModerate = session.marketplaceRoles.includes("moderator") || session.marketplaceRoles.includes("administrator");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPreview(await getModerationPreview(productId)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : t.moderation.loadError); }
    finally { setLoading(false); }
  }, [productId, t.moderation.loadError]);

  useEffect(() => {
    if (session.loading || !canModerate) return;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [canModerate, load, session.loading]);

  const actions = useMemo(() => preview ? actionsForState(preview.state) : [], [preview]);
  const [action, setAction] = useState<Action>("APPROVE");
  const selectedAction = actions.includes(action) ? action : actions[0] ?? action;

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true); setError(null); setSaved(false);
    try {
      await moderateListing(preview.id, {
        action: selectedAction,
        expectedVersion: preview.version,
        ...(text(data, "reasonCode") ? { reasonCode: text(data, "reasonCode").toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_") } : {}),
        ...(text(data, "publicReason") ? { publicReason: text(data, "publicReason") } : {}),
        ...(text(data, "internalNote") ? { internalNote: text(data, "internalNote") } : {}),
      });
      form.reset();
      setSaved(true);
      await load();
    } catch (cause) { setError(apiMessage(cause, t.moderation)); }
    finally { setSubmitting(false); }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview) return;
    const form = event.currentTarget;
    const note = text(new FormData(form), "note");
    setAddingNote(true); setError(null); setSaved(false);
    try { await addModerationNote(preview.id, preview.version, note); form.reset(); setSaved(true); await load(); }
    catch (cause) { setError(apiMessage(cause, t.moderation)); }
    finally { setAddingNote(false); }
  }

  if (session.loading) return <Status message={t.moderation.loading} />;
  if (!canModerate) return <Status message={t.moderation.accessDenied} error />;
  if (loading && !preview) return <Status message={t.moderation.loading} />;
  if (!preview) return <Status message={error ?? t.moderation.loadError} error action={<Button variant="secondary" onClick={() => void load()}><RotateCcw className="size-4" />{t.moderation.retry}</Button>} />;

  const manifest = preview.proposedSnapshot?.content as Manifest | undefined;
  const listing = manifest?.listing ?? {};
  const release = manifest?.release ?? {};
  const screenshots = Array.isArray(listing.screenshots) ? listing.screenshots as Array<{ url?: string; alt?: { en?: string; fa?: string } }> : [];
  const requiresReason = ["REQUEST_CHANGES", "REJECT", "SUSPEND"].includes(selectedAction);
  const releaseSourceReady = Boolean(preview.proposedSnapshot?.releaseManifest?.sourceResolvedAt
    && preview.proposedSnapshot.releaseManifest.ownershipVerifiedAt
    && preview.proposedSnapshot.releaseManifest.sourceCheckStatus === "VERIFIED");
  const actionBlocked = selectedAction === "PUBLISH" && !releaseSourceReady;
  const date = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" });

  return <section aria-labelledby="moderation-preview-title">
    <Link href={localePath("/moderation", locale)} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">{locale === "fa" ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{t.moderation.back}</Link>
    <header className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl"><p className="eyebrow">{t.moderation.eyebrow}</p><h1 id="moderation-preview-title" className="editorial mt-2 text-4xl sm:text-5xl">{preview.name}</h1><p className="mt-3 text-muted-foreground">{t.moderation.previewIntro}</p></div>
      <div className="rounded-xl border bg-surface px-4 py-3 text-sm"><strong>{t.moderation.creator}:</strong> {preview.creator.name} <span className="text-muted-foreground">@{preview.creator.handle}</span></div>
    </header>

    {preview.selfOwned && <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300"><ShieldAlert className="size-5 shrink-0" />{t.moderation.selfOwned}</div>}
    {error && <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</div>}
    {saved && <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700" role="status"><CheckCircle2 className="size-4" />{t.moderation.saved}</div>}

    <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Summary label={t.moderation.state} value={preview.state.replaceAll("_", " ")} />
      <Summary label={t.moderation.publicStatus} value={preview.published ? t.moderation.public : t.moderation.private} />
      <Summary label={t.moderation.revision} value={String(preview.proposedSnapshot?.revision ?? "—")} />
      <Summary label={t.moderation.release} value={stringValue(release.version) || "—"} />
    </dl>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <Panel title={t.moderation.listingMetadata}><JsonBlock value={listing} /></Panel>
        <Panel title={t.moderation.screenshots}>{screenshots.length ? <ul className="space-y-3">{screenshots.map((item, index) => <li key={`${item.url}-${index}`} className="rounded-lg border p-3"><a className="break-all text-sm font-semibold text-primary hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.url}<ExternalLink className="ms-1 inline size-3.5" /></a><p className="mt-1 text-xs text-muted-foreground">{locale === "fa" ? item.alt?.fa ?? item.alt?.en : item.alt?.en}</p></li>)}</ul> : <Empty />}</Panel>
        <Panel title={t.moderation.exactSource}>
          <dl className="grid gap-4 sm:grid-cols-2"><Fact label="Kind" value={preview.proposedSnapshot?.releaseManifest?.sourceKind ?? "—"} /><Fact label="URL" value={preview.proposedSnapshot?.releaseManifest?.sourceUrl ?? "—"} /><Fact label="Reference" value={preview.proposedSnapshot?.releaseManifest?.sourceRef ?? "—"} /><Fact label="Path / asset" value={preview.proposedSnapshot?.releaseManifest?.sourcePath ?? "—"} /><Fact label={t.moderation.sourceResolved} value={releaseSourceReady ? t.moderation.checkPassed : t.moderation.checkPending} /><Fact label={t.moderation.ownershipVerified} value={releaseSourceReady ? t.moderation.checkPassed : t.moderation.checkPending} /><Fact label="Source check" value={preview.proposedSnapshot?.releaseManifest?.sourceCheckStatus?.toLowerCase() ?? "pending"} /></dl>
        </Panel>
        <Panel title={t.moderation.compatibility}><JsonBlock value={release.compatibility} /></Panel>
        <Panel title={t.moderation.installation}><JsonBlock value={release.installation} /></Panel>
        <Panel title={t.moderation.requirements}><JsonBlock value={release.requirements} /></Panel>
        <Panel title={t.moderation.permissions}><JsonBlock value={release.permissions} /></Panel>
        <Panel title={t.moderation.license}><JsonBlock value={release.license} /></Panel>
        <Panel title={t.moderation.typeDetails}><JsonBlock value={manifest?.typeDetails} /></Panel>
        <Panel title={t.moderation.communities}>{preview.proposedSnapshot?.communityRequests.length ? <div className="space-y-3">{preview.proposedSnapshot.communityRequests.map(({ community }) => <article key={community.slug} className="rounded-lg border p-4"><h3 className="font-semibold">{locale === "fa" ? community.nameFa ?? community.nameEn : community.nameEn}</h3><p className="mt-1 text-xs text-muted-foreground">{community.primaryPlatform}</p><p className="mt-3 text-sm">{locale === "fa" ? community.rulesFa ?? community.rulesEn : community.rulesEn}</p></article>)}</div> : <Empty />}</Panel>
        <Panel title={t.moderation.approvedBaseline}>{preview.approvedSnapshot ? <div><p className="text-sm text-muted-foreground">{t.moderation.revision} {preview.approvedSnapshot.revision} · {date.format(new Date(preview.approvedSnapshot.createdAt))}</p><div className="mt-4"><JsonBlock value={preview.approvedSnapshot.content} /></div></div> : <p className="text-sm text-muted-foreground">{t.moderation.noApprovedBaseline}</p>}</Panel>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <Panel title={t.moderation.decision}>
          {actions.length ? <form className="space-y-4" onSubmit={submitDecision}>
            <label className="block text-sm font-semibold">{t.moderation.action}<select className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedAction} onChange={(event) => setAction(event.target.value as Action)}>{actions.map((value) => <option key={value} value={value}>{actionLabel(value, t.moderation)}</option>)}</select></label>
            <label className="block text-sm font-semibold">{t.moderation.reasonCode}<Input className="mt-2" name="reasonCode" placeholder="POLICY_REASON" dir="ltr" /></label>
            <label className="block text-sm font-semibold">{t.moderation.publicReason}<span className="mt-1 block text-xs font-normal text-muted-foreground">{t.moderation.publicReasonHint}</span><textarea className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm" name="publicReason" required={requiresReason} /></label>
            <label className="block text-sm font-semibold">{t.moderation.internalNote}<span className="mt-1 block text-xs font-normal text-muted-foreground">{t.moderation.internalNoteHint}</span><textarea className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm" name="internalNote" /></label>
            <Button className="w-full" disabled={submitting || preview.selfOwned || actionBlocked}>{submitting ? t.moderation.submitting : t.moderation.submitDecision}</Button>
          </form> : <p className="text-sm text-muted-foreground">{t.moderation.noValue}</p>}
          <form className="mt-6 border-t pt-5" onSubmit={submitNote}><label className="block text-sm font-semibold">{t.moderation.internalNote}<span className="mt-1 block text-xs font-normal text-muted-foreground">{t.moderation.internalNoteHint}</span><textarea className="mt-2 min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm" name="note" required minLength={2} maxLength={4000} /></label><Button className="mt-3 w-full" variant="secondary" disabled={addingNote || preview.selfOwned}>{addingNote ? t.moderation.addingNote : t.moderation.addNote}</Button></form>
        </Panel>
      </aside>
    </div>

    <div className="mt-6"><Panel title={t.moderation.auditTrail}>{preview.auditTrailTruncated && <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">{t.moderation.auditLimited}</p>}{preview.auditTrail.length ? <ol className="space-y-3">{preview.auditTrail.map((event) => <li key={event.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{event.action.replaceAll("_", " ")}</strong><time className="text-xs text-muted-foreground" dateTime={event.createdAt}>{date.format(new Date(event.createdAt))}</time></div><p className="mt-1 text-xs text-muted-foreground">{event.actorType} · {event.reasonCode} · {event.previousState ?? "—"} → {event.resultingState}</p>{event.publicReason && <p className="mt-3 text-sm"><strong>{t.moderation.publicReasonLabel}:</strong> {event.publicReason}</p>}{event.internalNote && <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm"><strong>{t.moderation.internalNoteLabel}:</strong> {event.internalNote}</p>}<p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{t.moderation.correlation}: {event.correlationId}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">{t.moderation.noAudit}</p>}</Panel></div>
  </section>;
}

function actionsForState(state: string): Action[] { if (state === "submitted") return ["APPROVE", "REQUEST_CHANGES", "REJECT"]; if (state === "approved") return ["PUBLISH", "REQUEST_CHANGES", "REJECT"]; if (state === "published") return ["SUSPEND", "ARCHIVE"]; if (state === "suspended") return ["REINSTATE"]; if (state === "archived") return ["RESTORE"]; if (["draft", "changes_requested", "rejected"].includes(state)) return ["ARCHIVE"]; return []; }
function actionLabel(action: Action, copy: Record<string, string>) { const values: Record<Action, string> = { APPROVE: copy.actionApprove, PUBLISH: copy.actionPublish, REQUEST_CHANGES: copy.actionRequestChanges, REJECT: copy.actionReject, SUSPEND: copy.actionSuspend, REINSTATE: copy.actionReinstate, ARCHIVE: copy.actionArchive, RESTORE: copy.actionRestore }; return values[action]; }
function apiMessage(cause: unknown, copy: Record<string, string>) { if (cause instanceof ApiError && cause.code === "LISTING_VERSION_CONFLICT") return copy.conflict; return cause instanceof ApiError ? cause.message : copy.decisionError; }
function text(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-surface p-5 sm:p-6"><h2 className="editorial text-2xl">{title}</h2><div className="mt-4">{children}</div></section>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-surface p-4"><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-2 font-semibold capitalize">{value}</dd></div>; }
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm font-semibold">{value}</dd></div>; }
function Empty() { const { t } = useLocale(); return <p className="text-sm text-muted-foreground">{t.moderation.noValue}</p>; }
function JsonBlock({ value }: { value: unknown }) { const { t } = useLocale(); if (value === undefined || value === null || Array.isArray(value) && value.length === 0) return <p className="text-sm text-muted-foreground">{t.moderation.noValue}</p>; return <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-4 text-xs leading-6" dir="ltr">{JSON.stringify(value, null, 2)}</pre>; }
function Status({ message, error, action }: { message: string; error?: boolean; action?: React.ReactNode }) { return <div className="rounded-2xl border bg-surface p-8"><p className={error ? "text-destructive" : "text-muted-foreground"} role={error ? "alert" : "status"}>{message}</p>{action && <div className="mt-5">{action}</div>}</div>; }
