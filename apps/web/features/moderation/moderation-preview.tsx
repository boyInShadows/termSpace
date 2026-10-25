"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw, ShieldAlert } from "lucide-react";
import { ApiError } from "@/lib/api";
import { addModerationNote, getModerationPreview, moderateCommunityPlacement, moderateListing } from "./moderation-api";
import type { MarketplaceModerationPreview } from "@/lib/types";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { useModerationCopy } from "./copy";
import { localePath, type Locale } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { intlLocale } from "@/lib/format";
import { ModerationReviews } from "@/features/moderation/moderation-reviews";
import { capabilityLabel, changedSections, diffCapabilities, isRecord, needsCloserLook, readCapabilities, type DeclaredCapability, type ManifestSection } from "./capabilities";
import { CloserLook, listingStateLabel, Panel, StateMark } from "./moderation-ui";

type Manifest = { listing?: Record<string, unknown>; release?: Record<string, unknown>; typeDetails?: Record<string, unknown> };
type Action = "APPROVE" | "PUBLISH" | "REQUEST_CHANGES" | "REJECT" | "SUSPEND" | "REINSTATE" | "ARCHIVE" | "RESTORE";
type Decision = { action: Action; reasonCode: string; publicReason: string; internalNote: string };
type Labels = Record<string, string>;
type Copy = ReturnType<typeof useModerationCopy>;

const DESTRUCTIVE: ReadonlySet<Action> = new Set(["REJECT", "SUSPEND", "ARCHIVE"]);
const NEEDS_REASON: ReadonlySet<Action> = new Set(["REQUEST_CHANGES", "REJECT", "SUSPEND"]);
const ALLOWED_BACK_PARAMS = ["state", "q", "page"];

export function ModerationPreview({ productId }: { productId: string }) {
  const { locale, t } = useLocale();
  const m = useModerationCopy();
  const session = useMarketplaceSession();
  const fromQueue = useSearchParams().get("from");
  const [preview, setPreview] = useState<MarketplaceModerationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recorded, setRecorded] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [pending, setPending] = useState<Decision | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [placementSubmitting, setPlacementSubmitting] = useState<string | null>(null);
  const decisionForm = useRef<HTMLFormElement>(null);
  const confirmBox = useRef<HTMLDivElement>(null);
  const canModerate = session.marketplaceRoles.includes("moderator") || session.marketplaceRoles.includes("administrator");

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try { setPreview(await getModerationPreview(productId)); }
    catch (cause) { setLoadError(cause instanceof ApiError ? cause.message : m.loadError); }
    finally { setLoading(false); }
  }, [productId, m.loadError]);

  useEffect(() => {
    if (session.loading || !canModerate) return;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [canModerate, load, session.loading]);

  useEffect(() => { if (pending) confirmBox.current?.focus(); }, [pending]);

  // Back returns to the queue as the moderator left it. Only the queue's own
  // parameters are carried over, rebuilt rather than echoed.
  const backHref = useMemo(() => {
    const source = new URLSearchParams(fromQueue ?? "");
    const kept = new URLSearchParams();
    for (const key of ALLOWED_BACK_PARAMS) { const value = source.get(key); if (value) kept.set(key, value); }
    return `${localePath("/dashboard/moderation", locale)}${kept.size ? `?${kept}` : ""}`;
  }, [fromQueue, locale]);

  const actions = useMemo(() => preview ? actionsForState(preview.state) : [], [preview]);
  const selected = action && actions.includes(action) ? action : null;

  function askToConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    setActionError(null); setRecorded(null);
    // Normalised here, not on commit, so the confirmation shows the code that will be stored.
    const reasonCode = text(data, "reasonCode").toUpperCase().replaceAll(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    setPending({ action: selected, reasonCode, publicReason: text(data, "publicReason"), internalNote: text(data, "internalNote") });
  }

  async function commitDecision() {
    if (!preview || !pending) return;
    setSubmitting(true); setActionError(null);
    try {
      await moderateListing(preview.id, {
        action: pending.action,
        expectedVersion: preview.version,
        ...(pending.reasonCode ? { reasonCode: pending.reasonCode } : {}),
        ...(pending.publicReason ? { publicReason: pending.publicReason } : {}),
        ...(pending.internalNote ? { internalNote: pending.internalNote } : {}),
      });
      decisionForm.current?.reset();
      setRecorded(fill(m.recorded, { action: (m.actionButton as Labels)[pending.action], name: preview.name }));
      setPending(null); setAction(null);
      await load();
    } catch (cause) { setActionError(apiMessage(cause, m)); setPending(null); }
    finally { setSubmitting(false); }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview) return;
    const form = event.currentTarget;
    const note = text(new FormData(form), "note");
    setAddingNote(true); setActionError(null); setRecorded(null);
    try { await addModerationNote(preview.id, preview.version, note); form.reset(); setRecorded(m.noteRecorded); await load(); }
    catch (cause) { setActionError(apiMessage(cause, m)); }
    finally { setAddingNote(false); }
  }

  async function submitPlacement(event: FormEvent<HTMLFormElement>, communitySlug: string, version: number) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPlacementSubmitting(communitySlug); setActionError(null); setRecorded(null);
    try {
      await moderateCommunityPlacement(preview!.id, communitySlug, {
        action: text(data, "action") as "APPROVE" | "REJECT" | "REMOVE",
        expectedVersion: version,
        ...(text(data, "publicReason") ? { publicReason: text(data, "publicReason") } : {}),
        ...(text(data, "internalNote") ? { internalNote: text(data, "internalNote") } : {}),
      });
      setRecorded(m.placementRecorded);
      await load();
    } catch (cause) { setActionError(apiMessage(cause, m)); }
    finally { setPlacementSubmitting(null); }
  }

  if (session.loading) return <Status message={m.loading} />;
  if (!canModerate) return <Status message={m.accessDenied} error />;
  if (loading && !preview) return <Status message={m.loading} />;
  if (!preview) return <Status message={loadError ?? m.loadError} error action={<Button variant="secondary" onClick={() => void load()}><RotateCcw className="size-4" />{m.retry}</Button>} />;

  const proposed = preview.proposedSnapshot;
  const approved = preview.approvedSnapshot;
  // A listing with nothing pending still shows what is live, so a moderator
  // about to suspend it sees what it declares.
  const content = (proposed?.content ?? approved?.content) as Manifest | undefined;
  const shownRevision = proposed?.revision ?? approved?.revision ?? null;
  const listing = content?.listing ?? {};
  const release = content?.release ?? {};
  const manifestRecord = proposed?.releaseManifest ?? null;
  const capabilities = readCapabilities(content);
  const compare = proposed && approved ? { caps: diffCapabilities(capabilities, readCapabilities(approved.content)), sections: changedSections(proposed.content, approved.content) } : null;
  const changed = (...sections: ManifestSection[]) => Boolean(compare?.sections.some((section) => sections.includes(section)));
  const screenshots = Array.isArray(listing.screenshots) ? listing.screenshots as Array<{ url?: string; alt?: { en?: string; fa?: string } }> : [];
  const sourceResolved = Boolean(manifestRecord?.sourceResolvedAt);
  const ownershipVerified = Boolean(manifestRecord?.ownershipVerifiedAt && manifestRecord.sourceCheckStatus === "VERIFIED");
  const actionBlocked = selected === "PUBLISH" && !(sourceResolved && ownershipVerified);
  // While the page refreshes, or if refreshing failed, the version on screen is
  // not the listing's: deciding against it would only meet a version conflict.
  const stale = loading || loadError !== null;
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" });
  const number = new Intl.NumberFormat(intlLocale(locale));
  const stateLabels = t.creatorHub as Labels;
  const releaseVersion = stringValue(release.version) || "—";

  return <section aria-labelledby="moderation-preview-title">
    <Link href={backHref} className="inline-flex min-h-6 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">{locale === "fa" ? <ArrowRight className="size-4" aria-hidden /> : <ArrowLeft className="size-4" aria-hidden />}{m.back}</Link>
    <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 id="moderation-preview-title" className="break-words text-2xl font-semibold sm:text-3xl"><bdi>{preview.name}</bdi></h1>
        <p className="mt-2 text-sm text-muted-foreground">{m.creator}: <bdi>{preview.creator.name}</bdi> · <bdi>@{preview.creator.handle}</bdi></p>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">{m.previewIntro}</p>
      </div>
      <a href="#decision" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}>{m.jumpToDecision}</a>
    </header>

    {preview.selfOwned && <div className="mt-6 flex items-center gap-3 border border-warning/60 p-4 text-sm"><ShieldAlert className="size-5 shrink-0 text-warning" aria-hidden />{m.selfOwned}</div>}

    <dl className="mt-6 grid grid-cols-2 border border-foreground/60 sm:grid-cols-4">
      <Cell label={m.state}><StateMark state={preview.state} label={listingStateLabel(preview.state, stateLabels)} /></Cell>
      <Cell label={m.publicStatus}>{preview.published ? m.public : m.private}</Cell>
      <Cell label={m.revision}>{shownRevision === null ? "—" : number.format(shownRevision)}</Cell>
      <Cell label={m.release}><bdi className="font-mono">{releaseVersion}</bdi></Cell>
    </dl>
    <p className="mt-2 text-xs text-muted-foreground">{shownRevision === null ? m.noApprovedBaseline : fill(proposed ? m.showingProposed : m.showingApproved, { revision: number.format(shownRevision) })}{proposed && !approved && ` ${m.noApprovedBaseline}`}</p>

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
      <div className="min-w-0 space-y-6">
        {compare && <Panel id="changes-title" title={m.changesTitle}>
          {compare.sections.length === 0 ? <p className="text-sm text-muted-foreground">{m.changesNone}</p>
            : <ul className="flex flex-wrap gap-2 text-sm">{[...new Set(compare.sections.map((section) => sectionLabel(section, m)))].map((label) => <li key={label} className="border border-foreground/60 px-2 py-1 font-medium">{label}</li>)}</ul>}
        </Panel>}

        <Panel id="touches-title" title={m.touches} aside={capabilities.some((entry) => needsCloserLook(entry.capability)) ? <CloserLook label={m.riskFlag} /> : undefined}>
          <p className="max-w-prose text-sm text-muted-foreground">{m.touchesIntro}</p>
          {capabilities.length === 0 ? <p className="mt-4 text-sm font-medium">{m.confirmNoCaps}</p> : <ul className="mt-4 divide-y divide-border border border-border">
            {capabilities.map((entry) => <CapabilityItem key={entry.capability} entry={entry} mark={compare?.caps.marks.get(entry.capability)} m={m} locale={locale} />)}
          </ul>}
          {compare && compare.caps.removed.length > 0 && <div className="mt-4">
            <h3 className="text-sm font-semibold">{m.removedCaps}</h3>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">{compare.caps.removed.map((entry) => <li key={entry.capability} className="border border-border px-2 py-1 text-muted-foreground line-through">{capabilityLabel(locale, entry.capability)}</li>)}</ul>
          </div>}
        </Panel>

        <Panel id="source-title" title={m.source} aside={changed("source") ? <ChangeMark label={m.changedMark} /> : undefined}>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {sourceFacts(manifestRecord, release.source, proposed?.digestSha256 ?? null, m).map((fact) => <Fact key={fact.label} label={fact.label} mono={fact.mono}>{fact.value}</Fact>)}
            {manifestRecord && <>
              <Fact label={m.sourceResolved}><Check ok={sourceResolved} yes={m.sourceOk} no={m.checkPending} /></Fact>
              <Fact label={m.ownershipVerified}><Check ok={ownershipVerified} yes={m.ownerOk} no={m.checkPending} /></Fact>
            </>}
          </dl>
        </Panel>

        <Panel id="install-title" title={m.installAndRequirements} aside={changed("installation", "requirements", "license", "compatibility") ? <ChangeMark label={m.changedMark} /> : undefined}>
          <InstallAndRequirements release={release} m={m} />
        </Panel>

        <Panel id="screenshots-title" title={m.screenshots}>
          {screenshots.length ? <>
            <p className="text-sm text-muted-foreground">{m.screenshotsHint}</p>
            <ul className="mt-3 space-y-3">{screenshots.map((item, index) => <li key={`${item.url}-${index}`} className="border border-border p-3"><code className="break-all text-sm" dir="ltr">{item.url}</code><p className="mt-1 text-xs text-muted-foreground">{locale === "fa" ? item.alt?.fa ?? item.alt?.en : item.alt?.en}</p></li>)}</ul>
          </> : <p className="text-sm text-muted-foreground">{m.noValue}</p>}
        </Panel>

        <Panel id="communities-title" title={m.communitiesPanel}>{proposed?.communityRequests.length ? <div className="space-y-3">{proposed.communityRequests.map(({ community, placement }) => {
          const options = placement?.state === "REQUESTED" ? ["APPROVE", "REJECT"] as const : placement?.state === "APPROVED" ? ["REMOVE"] as const : [];
          const placementState = placement?.state.toLowerCase() ?? "requested";
          return <article key={community.slug} className="border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold"><bdi>{locale === "fa" ? community.nameFa ?? community.nameEn : community.nameEn}</bdi></h3><p className="mt-1 text-xs text-muted-foreground"><bdi>{community.primaryPlatform}</bdi></p></div><span className="border border-border px-2 py-0.5 text-xs font-semibold">{(m.placementStates as Labels)[placementState] ?? placementState}</span></div>
            <p className="mt-3 text-sm">{locale === "fa" ? community.rulesFa ?? community.rulesEn : community.rulesEn}</p>
            {placement?.publicReason && <p className="mt-3 bg-muted/50 p-3 text-sm">{placement.publicReason}</p>}
            {placement && options.length > 0 && <form className="mt-4 grid gap-3 border-t border-border pt-4" onSubmit={(event) => void submitPlacement(event, community.slug, placement.version)}>
              <label className="text-sm font-semibold">{m.decisionLabel}<select name="action" className="mt-2 min-h-11 w-full border border-input bg-background px-3 text-sm">{options.map((value) => <option key={value} value={value}>{(m.placementActions as Labels)[value]}</option>)}</select></label>
              <label className="text-sm font-semibold">{m.publicReason}<textarea name="publicReason" className="mt-2 min-h-20 w-full border border-input bg-background p-3 text-sm" /></label>
              <label className="text-sm font-semibold">{m.internalNote}<textarea name="internalNote" className="mt-2 min-h-20 w-full border border-input bg-background p-3 text-sm" /></label>
              <Button type="submit" variant="secondary" disabled={placementSubmitting === community.slug}>{placementSubmitting === community.slug ? m.submitting : m.saveCommunityDecision}</Button>
            </form>}
          </article>;
        })}</div> : <p className="text-sm text-muted-foreground">{m.noValue}</p>}</Panel>

        <details className="border border-foreground/60 bg-surface">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold">{m.rawManifest}</summary>
          <div className="min-w-0 space-y-4 border-t border-foreground/60 p-4">
            <p className="text-sm text-muted-foreground">{m.rawManifestHint}</p>
            <RawBlock title={m.listingMetadata} value={listing} changed={changed("listing")} changedLabel={m.changedMark} empty={m.noValue} />
            <RawBlock title={m.typeDetails} value={content?.typeDetails} changed={changed("typeDetails")} changedLabel={m.changedMark} empty={m.noValue} />
          </div>
        </details>

        {proposed && approved && <details className="border border-foreground/60 bg-surface">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold">{m.approvedBaseline} · {m.revision} {number.format(approved.revision)}</summary>
          <div className="min-w-0 border-t border-foreground/60 p-4">
            <p className="mb-3 text-xs text-muted-foreground">{date.format(new Date(approved.createdAt))}</p>
            <RawBlock title={m.approvedBaseline} value={approved.content} empty={m.noValue} />
          </div>
        </details>}
      </div>

      <aside id="decision" aria-labelledby="decision-title" className="min-w-0 scroll-mt-20 xl:sticky xl:top-20 xl:self-start">
        <Panel id="decision-title" title={m.decision}>
          <div aria-live="polite">{recorded && <p className="mb-4 border border-verified/60 p-3 text-sm font-medium" role="status">{recorded}</p>}</div>
          {loadError && <div className="mb-4 border border-destructive/60 p-3 text-sm" role="alert"><p className="text-destructive">{recorded ? m.staleAfterSave : loadError}</p><Button size="sm" variant="secondary" className="mt-3" onClick={() => void load()}><RotateCcw className="size-4" aria-hidden />{m.retry}</Button></div>}
          {actionError && <p className="mb-4 border border-destructive/60 p-3 text-sm text-destructive" role="alert">{actionError}</p>}
          {actions.length ? <form ref={decisionForm} className="space-y-4" onSubmit={askToConfirm}>
            <fieldset disabled={pending !== null || submitting || stale || preview.selfOwned} className="min-w-0 space-y-3">
              <legend className="text-sm font-semibold">{m.chooseDecision}</legend>
              {actions.map((value) => {
                const id = `decision-${value.toLowerCase()}`;
                return <label key={value} className={cn("flex cursor-pointer items-start gap-3 border p-3", selected === value ? "border-foreground" : "border-border")}>
                  <input type="radio" name="action" value={value} checked={selected === value} onChange={() => setAction(value)} aria-labelledby={`${id}-name`} aria-describedby={`${id}-effect`} className="mt-1 size-4 shrink-0" />
                  <span className="min-w-0"><span id={`${id}-name`} className="block text-sm font-semibold">{(m.actionButton as Labels)[value]}</span><span id={`${id}-effect`} className="mt-0.5 block text-xs text-muted-foreground">{(m.consequences as Labels)[value]}</span></span>
                </label>;
              })}
            </fieldset>
            <fieldset disabled={pending !== null || submitting || stale || preview.selfOwned} className="min-w-0 space-y-4">
              <label className="block text-sm font-semibold">{m.reasonCode}<span className="mt-1 block text-xs font-normal text-muted-foreground">{m.reasonCodeHint}</span><Input className="mt-2" name="reasonCode" dir="ltr" autoComplete="off" /></label>
              <label className="block text-sm font-semibold">{m.publicReason}<span className="mt-1 block text-xs font-normal text-muted-foreground">{m.publicReasonHint}</span><textarea className="mt-2 min-h-28 w-full border border-input bg-background p-3 text-sm" name="publicReason" required={selected !== null && NEEDS_REASON.has(selected)} minLength={10} maxLength={1000} /></label>
              <label className="block text-sm font-semibold">{m.internalNote}<span className="mt-1 block text-xs font-normal text-muted-foreground">{m.internalNoteHint}</span><textarea className="mt-2 min-h-28 w-full border border-input bg-background p-3 text-sm" name="internalNote" maxLength={4000} /></label>
            </fieldset>
            {actionBlocked && <p className="text-xs text-muted-foreground" role="note">{m.publishBlocked}</p>}
            <Button className="w-full" variant={selected && DESTRUCTIVE.has(selected) ? "destructive" : "primary"} disabled={!selected || pending !== null || submitting || stale || preview.selfOwned || actionBlocked}>{selected ? (m.actionButton as Labels)[selected] : m.chooseFirst}</Button>
          </form> : <p className="text-sm text-muted-foreground">{m.noActions}</p>}

          {pending && <div ref={confirmBox} tabIndex={-1} role="group" aria-labelledby="confirm-title" className="mt-4 border-2 border-foreground p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <h3 id="confirm-title" className="text-sm font-semibold">{fill(m.confirmTitle, { action: (m.actionButton as Labels)[pending.action] })}</h3>
            <p className="mt-1 text-sm"><bdi>{fill(m.confirmIntro, { name: preview.name, release: releaseVersion })}</bdi></p>
            <p className="mt-2 text-xs text-muted-foreground">{(m.consequences as Labels)[pending.action]}</p>
            {(pending.action === "APPROVE" || pending.action === "PUBLISH") && <div className="mt-3">
              <p className="text-sm font-semibold">{capabilities.length ? m.confirmCaps : m.confirmNoCaps}</p>
              {capabilities.length > 0 && <ul className="mt-2 space-y-1 text-sm">{capabilities.map((entry) => <li key={entry.capability} className="flex flex-wrap items-center gap-2">{capabilityLabel(locale, entry.capability)}{needsCloserLook(entry.capability) && <CloserLook label={m.riskFlag} />}</li>)}</ul>}
            </div>}
            {pending.reasonCode && <p className="mt-3 text-sm"><strong>{m.confirmReasonCode}:</strong> <bdi className="font-mono" dir="ltr">{pending.reasonCode}</bdi></p>}
            {pending.publicReason && <p className="mt-3 text-sm"><strong>{m.confirmReason}:</strong> <bdi>{pending.publicReason}</bdi></p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={DESTRUCTIVE.has(pending.action) ? "destructive" : "primary"} disabled={submitting} onClick={() => void commitDecision()}>{submitting ? m.submitting : (m.actionButton as Labels)[pending.action]}</Button>
              <Button variant="secondary" disabled={submitting} onClick={() => setPending(null)}>{m.goBack}</Button>
            </div>
          </div>}

          <form className="mt-6 border-t border-border pt-5" onSubmit={submitNote}>
            <h3 className="text-sm font-semibold">{m.standaloneNote}</h3>
            <label className="mt-3 block text-sm font-semibold">{m.standaloneNoteLabel}<span className="mt-1 block text-xs font-normal text-muted-foreground">{m.internalNoteHint}</span><textarea className="mt-2 min-h-24 w-full border border-input bg-background p-3 text-sm" name="note" required minLength={2} maxLength={4000} /></label>
            <Button className="mt-3 w-full" variant="secondary" disabled={addingNote || stale || preview.selfOwned}>{addingNote ? m.addingNote : m.addNote}</Button>
          </form>
        </Panel>
      </aside>
    </div>

    <div className="mt-6"><Panel id="audit-title" title={m.auditTrail}>
      {preview.auditTrailTruncated && <p className="mb-4 text-sm text-muted-foreground">{m.auditLimited}</p>}
      {preview.auditTrail.length ? <ol className="divide-y divide-border border border-border">{preview.auditTrail.map((event) => <li key={event.id} className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{(m.auditActions as Labels)[event.action] ?? event.action.replaceAll("_", " ").toLowerCase()}</strong><time className="text-xs text-muted-foreground" dateTime={event.createdAt}>{date.format(new Date(event.createdAt))}</time></div>
        <p className="mt-1 text-xs text-muted-foreground">{(m.actorTypes as Labels)[event.actorType] ?? event.actorType} · <bdi className="font-mono">{event.reasonCode}</bdi> · {fill(m.auditTransition, { from: listingStateLabel(event.previousState ?? "—", stateLabels), to: listingStateLabel(event.resultingState, stateLabels) })}</p>
        {event.publicReason && <p className="mt-2 text-sm"><strong>{m.publicReasonLabel}:</strong> {event.publicReason}</p>}
        {event.internalNote && <p className="mt-2 bg-muted/50 p-3 text-sm"><strong>{m.internalNoteLabel}:</strong> {event.internalNote}</p>}
        <p className="mt-2 break-all font-mono text-xs text-muted-foreground" dir="ltr">{m.correlation}: {event.correlationId}</p>
      </li>)}</ol> : <p className="text-sm text-muted-foreground">{m.noAudit}</p>}
    </Panel></div>
    <div className="mt-6"><ModerationReviews productId={productId} /></div>
  </section>;
}

function actionsForState(state: string): Action[] { if (state === "submitted") return ["APPROVE", "REQUEST_CHANGES", "REJECT"]; if (state === "approved") return ["PUBLISH", "REQUEST_CHANGES", "REJECT"]; if (state === "published") return ["SUSPEND", "ARCHIVE"]; if (state === "suspended") return ["REINSTATE"]; if (state === "archived") return ["RESTORE"]; if (["draft", "changes_requested", "rejected"].includes(state)) return ["ARCHIVE"]; return []; }
function apiMessage(cause: unknown, copy: { conflict: string; decisionError: string }) { if (cause instanceof ApiError && cause.code === "LISTING_VERSION_CONFLICT") return copy.conflict; return cause instanceof ApiError ? cause.message : copy.decisionError; }
function text(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function stringValue(value: unknown) { return typeof value === "string" ? value : ""; }
function fill(template: string, values: Record<string, string>) { return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? ""); }
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function sectionLabel(section: ManifestSection, m: Copy) {
  const labels: Record<ManifestSection, string> = {
    listing: m.listingMetadata, compatibility: m.compatibility, installation: m.installAndRequirements,
    requirements: m.installAndRequirements, permissions: m.touches, license: m.license,
    source: m.source, typeDetails: m.typeDetails,
  };
  return labels[section];
}

function sourceFacts(record: NonNullable<MarketplaceModerationPreview["proposedSnapshot"]>["releaseManifest"], source: unknown, snapshotDigest: string | null, m: Copy) {
  const declared = isRecord(source) ? source : {};
  const pick = (...values: unknown[]) => values.find((value): value is string => typeof value === "string" && value.length > 0) ?? null;
  const kind = (record?.sourceKind ?? pick(declared.kind))?.toLowerCase() ?? null;
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [];
  const add = (label: string, value: string | null, mono = true) => { if (value) rows.push({ label, value, mono }); };
  add(m.sourceKind, kind ? (m.sourceKinds as Labels)[kind] ?? kind : null, false);
  add(m.sourceAddress, pick(record?.sourceUrl, declared.repositoryUrl, declared.packageName));
  add(m.sourceRef, pick(record?.sourceRef, declared.commitSha, declared.releaseCommitSha, declared.version, declared.tag));
  add(m.sourcePath, pick(record?.sourcePath, declared.path, declared.assetName));
  add(m.sourceDigest, pick(record?.providerIntegrityDigest, declared.integrity, declared.assetDigest));
  add(m.snapshotDigest, snapshotDigest);
  const status = record?.sourceCheckStatus.toLowerCase();
  add(m.sourceStatus, status ? (m.checkStatus as Labels)[status] ?? status : null, false);
  return rows;
}

function InstallAndRequirements({ release, m }: { release: Record<string, unknown>; m: Copy }) {
  const installation = isRecord(release.installation) ? release.installation : null;
  const requirements = isRecord(release.requirements) ? release.requirements : {};
  const license = isRecord(release.license) ? release.license : null;
  const compatibility = Array.isArray(release.compatibility) ? release.compatibility.filter(isRecord) : [];
  const envVars = Array.isArray(requirements.environmentVariables) ? requirements.environmentVariables.filter(isRecord) : [];
  const lists: Array<[string, string[]]> = [
    [m.runtimes, strings(requirements.runtimes)], [m.accounts, strings(requirements.accounts)],
    [m.operatingSystems, strings(requirements.operatingSystems)], [m.dependencies, strings(requirements.dependencies)],
  ];
  return <div className="space-y-4">
    {installation && <div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2"><Fact label={m.installMethod}>{(m.installMethods as Labels)[stringValue(installation.method)] ?? stringValue(installation.method)}</Fact></dl>
      <h3 className="mt-3 text-sm font-semibold">{m.installSteps}</h3>
      <ol dir="auto" className="mt-1 list-decimal space-y-1 ps-5 text-sm">{strings(installation.instructions).map((step, index) => <li key={index} className="break-words">{step}</li>)}</ol>
    </div>}
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {lists.filter(([, items]) => items.length > 0).map(([name, items]) => <Fact key={name} label={name}>{items.join(", ")}</Fact>)}
      {envVars.length > 0 && <Fact label={m.envVars} mono>{envVars.map((entry) => stringValue(entry.name)).join(", ")}</Fact>}
      {compatibility.length > 0 && <Fact label={m.platforms}>{compatibility.map((entry) => stringValue(entry.platform)).join(", ")}</Fact>}
      {compatibility.some((entry) => strings(entry.models).length > 0) && <Fact label={m.models}>{[...new Set(compatibility.flatMap((entry) => strings(entry.models)))].join(", ")}</Fact>}
      {license && (stringValue(license.identifier)
        ? <Fact label={m.license} mono>{stringValue(license.identifier)}</Fact>
        : <Fact label={m.customLicense} mono>{stringValue(license.customUrl)}</Fact>)}
    </dl>
  </div>;
}

function CapabilityItem({ entry, mark, m, locale }: { entry: DeclaredCapability; mark?: "new" | "changed"; m: Copy; locale: Locale }) {
  return <li className="p-3">
    <div className="flex flex-wrap items-center gap-2">
      <strong className="text-sm">{capabilityLabel(locale, entry.capability)}</strong>
      <span className="text-xs text-muted-foreground">{entry.required ? m.required : m.optional}</span>
      {needsCloserLook(entry.capability) && <CloserLook label={m.riskFlag} />}
      {mark && <ChangeMark label={mark === "new" ? m.newMark : m.changedMark} />}
    </div>
    <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
      {entry.scope && <><dt className="text-muted-foreground">{m.scope}</dt><dd className="break-words"><bdi>{entry.scope}</bdi></dd></>}
      {entry.purpose && <><dt className="text-muted-foreground">{m.purpose}</dt><dd className="break-words">{entry.purpose}</dd></>}
      {entry.destinations.length > 0 && <><dt className="text-muted-foreground">{m.destinations}</dt><dd className="break-all font-mono text-xs" dir="ltr">{entry.destinations.join(", ")}</dd></>}
    </dl>
  </li>;
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) { return <div className="border-b border-border p-4 sm:border-b-0 sm:[&:not(:last-child)]:border-e sm:[&:not(:last-child)]:border-foreground/60"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1.5 text-sm font-semibold">{children}</dd></div>; }
function Fact({ label, mono, children }: { label: string; mono?: boolean; children: React.ReactNode }) { return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={cn("mt-1 break-all text-sm font-medium", mono && "font-mono text-xs")}>{mono ? <bdi>{children}</bdi> : children}</dd></div>; }
function Check({ ok, yes, no }: { ok: boolean; yes: string; no: string }) { return ok ? <>{yes}</> : <span className="inline-flex border border-warning/60 px-1.5">{no}</span>; }
function ChangeMark({ label }: { label: string }) { return <span className="border border-foreground/60 px-1.5 py-0.5 text-xs font-semibold">{label}</span>; }
function RawBlock({ title, value, changed, changedLabel, empty }: { title: string; value: unknown; changed?: boolean; changedLabel?: string; empty: string }) {
  const blank = value === undefined || value === null || (Array.isArray(value) && value.length === 0) || (isRecord(value) && Object.keys(value).length === 0);
  return <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{title}</h3>{changed && changedLabel && <ChangeMark label={changedLabel} />}</div>{blank ? <p className="mt-1 text-sm text-muted-foreground">{empty}</p> : <pre className="mt-2 max-h-[34rem] overflow-auto whitespace-pre-wrap break-words bg-muted/50 p-4 text-xs leading-6" dir="ltr">{JSON.stringify(value, null, 2)}</pre>}</div>;
}
function Status({ message, error, action }: { message: string; error?: boolean; action?: React.ReactNode }) { return <div className="border-y py-6"><p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={error ? "alert" : "status"}>{message}</p>{action && <div className="mt-4">{action}</div>}</div>; }
