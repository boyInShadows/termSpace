"use client";

import { cloneElement, FormEvent, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { ApiError, createCreatorDraft, getCreatorDraft, getMarketplaceDraftOptions, getMarketplaceItemTypes, updateCreatorDraft } from "@/lib/api";
import type { MarketplaceDraftOptions, MarketplaceDraftRecord, MarketplaceItemType, MarketplaceItemTypeKey } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { creatorWorkspace } from "./workspace-copy";
import { localePath, type DraftMessages } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductIcon } from "@/components/marketplace/product-icon";
import { ContextHelp } from "@/components/ui/context-help";
import { helpHints } from "@/components/ui/context-help-hints";
import type { HelpTopic } from "@/components/ui/context-help-copy";
import { DeclarationRows } from "./declaration-rows";
import { ChoiceRows } from "./choice-rows";
import { FormDisclosure } from "./form-disclosure";
import { permissionLabels } from "./permission-labels";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { parseDraftCheckpoint, type DraftCheckpoint } from "./draft-checkpoint";
import { formatNumber } from "@/lib/format";
import { draftValidationCopy, evaluateDraft, serverDraftIssues, type DraftControl, type DraftIssue, type DraftStepState } from "./draft-validation";
import { DraftFieldErrors } from "./draft-field-errors";

type SourceKind = "external_link" | "github_repository" | "github_release" | "npm";
type FieldKind = "text" | "textarea" | "list" | "boolean" | "select" | "stages";
type DetailField = { key: string; en: string; fa: string; kind: FieldKind; required?: boolean; options?: string[] };
type ManifestLike = {
  manifestVersion?: number;
  type?: MarketplaceItemTypeKey;
  listing?: Record<string, unknown>;
  release?: Record<string, unknown> & { source?: Record<string, unknown>; installation?: Record<string, unknown>; requirements?: Record<string, unknown>; license?: Record<string, unknown> };
  typeDetails?: Record<string, unknown>;
};

const detailFields: Record<MarketplaceItemTypeKey, DetailField[]> = {
  skill: [
    { key: "format", en: "Skill format", fa: "قالب مهارت", kind: "text", required: true },
    { key: "entryPath", en: "Entry path", fa: "مسیر ورودی", kind: "text", required: true },
    { key: "activation", en: "Activation", fa: "روش فعال‌سازی", kind: "textarea", required: true },
    { key: "bundledExecutables", en: "Includes executables", fa: "شامل فایل اجرایی", kind: "boolean" },
    { key: "inputs", en: "Inputs", fa: "ورودی‌ها", kind: "list" },
    { key: "outputs", en: "Outputs", fa: "خروجی‌ها", kind: "list" },
  ],
  agent: [
    { key: "scope", en: "Agent scope", fa: "دامنهٔ عامل", kind: "select", options: ["primary", "subagent"], required: true },
    { key: "entryPath", en: "Entry path", fa: "مسیر ورودی", kind: "text", required: true },
    { key: "invocation", en: "Invocation", fa: "روش فراخوانی", kind: "textarea", required: true },
    { key: "tools", en: "Tools", fa: "ابزارها", kind: "list" },
    { key: "capabilities", en: "Capabilities", fa: "قابلیت‌ها", kind: "list" },
    { key: "modelRequirements", en: "Model requirements", fa: "نیازمندی‌های مدل", kind: "list" },
    { key: "inputs", en: "Inputs", fa: "ورودی‌ها", kind: "list" },
    { key: "outputs", en: "Outputs", fa: "خروجی‌ها", kind: "list" },
  ],
  mcp_server: [
    { key: "transport", en: "Transport", fa: "روش انتقال", kind: "select", options: ["stdio", "streamable_http", "sse"], required: true },
    { key: "connectionMethod", en: "Connection method", fa: "روش اتصال", kind: "textarea", required: true },
    { key: "distributionIdentity", en: "Distribution identity", fa: "شناسهٔ توزیع", kind: "text", required: true },
    { key: "exposedTools", en: "Exposed tools", fa: "ابزارهای ارائه‌شده", kind: "list" },
    { key: "exposedResources", en: "Exposed resources", fa: "منابع ارائه‌شده", kind: "list" },
    { key: "exposedPrompts", en: "Exposed prompts", fa: "پرامپت‌های ارائه‌شده", kind: "list" },
    { key: "authenticationMethod", en: "Authentication method", fa: "روش احراز هویت", kind: "textarea", required: true },
    { key: "networkDestinations", en: "Network destinations", fa: "مقصدهای شبکه", kind: "list" },
    { key: "dataHandling", en: "Data handling", fa: "نحوهٔ مدیریت داده", kind: "textarea", required: true },
  ],
  integration: [
    { key: "integrationKind", en: "Integration kind", fa: "نوع یکپارچه‌سازی", kind: "select", options: ["connector", "plugin", "extension"], required: true },
    { key: "hostPlatform", en: "Host platform", fa: "سکوی میزبان", kind: "text", required: true },
    { key: "installationIdentifier", en: "Installation identifier", fa: "شناسهٔ نصب", kind: "text", required: true },
    { key: "connectedService", en: "Connected service", fa: "خدمت متصل", kind: "text", required: true },
    { key: "requestedScopes", en: "Requested scopes", fa: "دامنه‌های درخواستی", kind: "list" },
    { key: "authentication", en: "Authentication", fa: "احراز هویت", kind: "textarea", required: true },
    { key: "callback", en: "Callback", fa: "بازگشت فراخوانی", kind: "text" },
    { key: "dataFlow", en: "Data flow", fa: "جریان داده", kind: "textarea", required: true },
  ],
  rule: [
    { key: "format", en: "Rule format", fa: "قالب قاعده", kind: "text", required: true },
    { key: "destinationScope", en: "Destination scope", fa: "دامنهٔ مقصد", kind: "text", required: true },
    { key: "entryPath", en: "Entry path", fa: "مسیر ورودی", kind: "text", required: true },
    { key: "activation", en: "Activation", fa: "روش فعال‌سازی", kind: "textarea", required: true },
    { key: "applicablePaths", en: "Applicable paths", fa: "مسیرهای قابل اعمال", kind: "list" },
    { key: "expectedEffect", en: "Expected effect", fa: "اثر مورد انتظار", kind: "textarea", required: true },
  ],
  prompt: [
    { key: "format", en: "Prompt format", fa: "قالب پرامپت", kind: "select", options: ["single", "bundle"], required: true },
    { key: "entryPaths", en: "Entry paths", fa: "مسیرهای ورودی", kind: "list", required: true },
    { key: "variables", en: "Variables", fa: "متغیرها", kind: "list" },
    { key: "requiredInputs", en: "Required inputs", fa: "ورودی‌های الزامی", kind: "list" },
    { key: "outputContract", en: "Output contract", fa: "قرارداد خروجی", kind: "textarea", required: true },
    { key: "intendedModels", en: "Intended models", fa: "مدل‌های هدف", kind: "list", required: true },
  ],
  hook: [
    { key: "events", en: "Events", fa: "رویدادها", kind: "list", required: true },
    { key: "hostPlatform", en: "Host platform", fa: "سکوی میزبان", kind: "text", required: true },
    { key: "entryPaths", en: "Entry paths", fa: "مسیرهای ورودی", kind: "list", required: true },
    { key: "runtime", en: "Runtime", fa: "محیط اجرا", kind: "text", required: true },
    { key: "behavior", en: "Behavior", fa: "رفتار", kind: "select", options: ["synchronous", "asynchronous"], required: true },
    { key: "failurePolicy", en: "Failure policy", fa: "سیاست شکست", kind: "textarea", required: true },
    { key: "effects", en: "Effects", fa: "اثرها", kind: "list" },
  ],
  template: [
    { key: "templateKind", en: "Template kind", fa: "نوع قالب", kind: "text", required: true },
    { key: "includedPaths", en: "Included paths", fa: "مسیرهای درون قالب", kind: "list", required: true },
    { key: "outputFormat", en: "Output format", fa: "قالب خروجی", kind: "text", required: true },
    { key: "initializationMethod", en: "Initialization method", fa: "روش راه‌اندازی", kind: "textarea", required: true },
    { key: "replacementVariables", en: "Replacement variables", fa: "متغیرهای جایگزین", kind: "list" },
    { key: "executesScripts", en: "Executes scripts", fa: "اسکریپت اجرا می‌کند", kind: "boolean" },
  ],
  workflow: [
    { key: "stages", en: "Stages", fa: "مرحله‌ها", kind: "stages", required: true },
    { key: "dependencies", en: "Dependencies", fa: "وابستگی‌ها", kind: "list" },
    { key: "executionMethod", en: "Execution method", fa: "روش اجرا", kind: "textarea", required: true },
    { key: "initialInputs", en: "Initial inputs", fa: "ورودی‌های آغازین", kind: "list" },
    { key: "intermediateState", en: "Intermediate state", fa: "وضعیت میانی", kind: "textarea", required: true },
    { key: "finalOutputs", en: "Final outputs", fa: "خروجی‌های نهایی", kind: "list" },
    { key: "retryBehavior", en: "Retry behavior", fa: "رفتار تلاش دوباره", kind: "textarea", required: true },
    { key: "rollbackBehavior", en: "Rollback behavior", fa: "رفتار بازگشت", kind: "textarea", required: true },
    { key: "partialFailureBehavior", en: "Partial failure behavior", fa: "رفتار شکست جزئی", kind: "textarea", required: true },
  ],
};

const lastStep = 3;
const stepParam = /^[1-4]$/;
// Delivery method that matches each source kind; the creator can still change it.
const installMethodFor: Record<SourceKind, string> = { external_link: "manual", github_repository: "git", github_release: "download", npm: "npm" };
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);

const isPrimaryDetail = (field: DetailField) => Boolean(field.required) || field.kind === "boolean";

const permissionCapabilities = ["filesystem_read", "filesystem_write", "process_execution", "network_access", "environment_access", "secret_access", "browser_automation", "external_account_access", "persistent_storage", "background_execution", "code_modification", "telemetry"];

export function CreatorDraftEditor({ productId, messages }: { productId?: string; messages: DraftMessages }) {
  const { locale, t } = useLocale();
  const copy = { ...messages, ...creatorWorkspace[locale].creatorDraft };
  const hints = helpHints[locale];
  const router = useRouter();
  const { email } = useMarketplaceSession();
  const storageKey = email ? `termspace:draft:${encodeURIComponent(email)}:${productId ?? "new"}` : null;
  const formRef = useRef<HTMLFormElement>(null);
  const pendingErrorFocus = useRef<DraftControl | null>(null);
  const [step, setStep] = useState(0);
  const [evaluation, setEvaluation] = useState<DraftStepState[]>([]);
  const [attempted, setAttempted] = useState<number[]>([]);
  const [remoteIssues, setRemoteIssues] = useState<DraftIssue[]>([]);
  const validation = draftValidationCopy[locale];
  const lastAutoSlug = useRef("");
  const [formRevision, setFormRevision] = useState(0);
  const [checkpoint, setCheckpoint] = useState<ReturnType<typeof buildManifest> | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [options, setOptions] = useState<MarketplaceDraftOptions | null>(null);
  const [itemTypes, setItemTypes] = useState<MarketplaceItemType[]>([]);
  const [record, setRecord] = useState<MarketplaceDraftRecord | null>(null);
  const [type, setType] = useState<MarketplaceItemTypeKey>("skill");
  const [sourceKind, setSourceKind] = useState<SourceKind>("external_link");
  const [customLicense, setCustomLicense] = useState(false);
  const [methodOverride, setMethodOverride] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const [preview, setPreview] = useState<ReturnType<typeof buildManifest> | null>(null);
  function markDirty() { setDirty(true); setSaved(false); setPreview(null); setRemoteIssues([]); setLocalStatus(null); setFormRevision((value) => value + 1); }

  useEffect(() => {
    let active = true;
    const requests = [getMarketplaceDraftOptions(), getMarketplaceItemTypes(), ...(productId ? [getCreatorDraft(productId)] : [])] as const;
    void Promise.all(requests).then(([nextOptions, nextTypes, nextRecord]) => {
      if (!active) return;
      setOptions(nextOptions as MarketplaceDraftOptions);
      setItemTypes(nextTypes as MarketplaceItemType[]);
      if (nextRecord) {
        const draftRecord = nextRecord as MarketplaceDraftRecord;
        setRecord(draftRecord);
        const manifest = draftRecord.draft?.content as ManifestLike | undefined;
        if (manifest?.type) setType(manifest.type);
        const nextSource = manifest?.release?.source?.kind;
        if (nextSource === "external_link" || nextSource === "github_repository" || nextSource === "github_release" || nextSource === "npm") setSourceKind(nextSource);
        setCustomLicense(Boolean(manifest?.release?.license?.customUrl));
      }
      let nextStep = 0;
      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const resume = parseDraftCheckpoint(raw);
            if (resume.version === ((nextRecord as MarketplaceDraftRecord | undefined)?.version ?? null)) {
              const data = new FormData();
              for (const [name, value] of resume.fields) data.append(name, value);
              setCheckpoint(buildManifest(data, resume.type, resume.sourceKind, resume.customLicense));
              setType(resume.type);
              setSourceKind(resume.sourceKind);
              setCustomLicense(resume.customLicense);
              nextStep = Math.min(resume.step, lastStep);
              setLocalStatus(copy.localRestored);
            } else setLocalStatus(copy.localStale);
          }
        } catch { setLocalStatus(copy.localRestoreError); }
      }
      const requestedStep = new URLSearchParams(window.location.search).get("step");
      if (requestedStep && stepParam.test(requestedStep)) nextStep = Number(requestedStep) - 1;
      setStep(nextStep);
    }).catch((cause) => {
      if (active) setError(cause instanceof ApiError ? cause.message : copy.loadError);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [copy.loadError, copy.localRestored, copy.localStale, copy.localRestoreError, productId, reload, storageKey]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const next = evaluateDraft(form, locale);
    setEvaluation(next);
    setPreview(next.every(item => item.requiredComplete && item.issues.length === 0) ? buildManifest(new FormData(form), type, sourceKind, customLicense) : null);
    if (!next.some((item, index) => attempted.includes(index) && item.issues.length)) setError(current => current === validation.errors ? null : current);
  }, [loading, formRevision, type, sourceKind, customLicense, locale, attempted, validation.errors]);

  useEffect(() => {
    const onBack = () => {
      const value = new URLSearchParams(window.location.search).get("step");
      setStep(value && stepParam.test(value) ? Number(value) - 1 : 0);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  useEffect(() => {
    const control = pendingErrorFocus.current;
    if (!control) return;
    pendingErrorFocus.current = null;
    control.scrollIntoView({ block: "center" });
    control.focus({ preventScroll: true });
  });

  function goToStep(next: number, focusHeading = true) {
    setStep(next);
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(next + 1));
    window.history.replaceState(window.history.state, "", url);
    if (focusHeading) requestAnimationFrame(() => {
      const heading = document.getElementById("draft-step-heading");
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: "start" });
    });
  }

  function saveForLater() {
    if (!storageKey || !formRef.current) return;
    try {
      const fields = Array.from(new FormData(formRef.current).entries(), ([name, value]): [string, string] => [name, String(value)]);
      const value: DraftCheckpoint = { version: record?.version ?? null, step, type, sourceKind, customLicense, fields };
      localStorage.setItem(storageKey, JSON.stringify(value));
      setDirty(false);
      setLocalStatus(copy.localSaved);
    } catch { setLocalStatus(copy.localSaveError); }
  }

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const guardLink = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const target = new URL(link.href);
      if (target.origin !== location.origin || target.pathname === location.pathname && target.search === location.search) return;
      if (!window.confirm(copy.discardChanges)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", guardLink, true);
    };
  }, [dirty, copy.discardChanges]);

  const manifest = useMemo(() => checkpoint ?? record?.draft?.content as ManifestLike | undefined, [checkpoint, record]);
  const listing = manifest?.listing ?? {};
  const release = manifest?.release ?? {};
  const source = release.source ?? {};
  const requirements = release.requirements ?? {};
  const installation = release.installation ?? {};
  const license = release.license ?? {};
  const details = manifest?.typeDetails ?? {};

  function clearDescriptionValidity(form: HTMLFormElement | null) {
    if (!form) return;
    for (const name of ["descriptionEn", "descriptionFa"]) {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLTextAreaElement) field.setCustomValidity("");
    }
    if (error === copy.descriptionRequired) setError(null);
  }

  function focusIssue(issue: DraftIssue) {
    for (let node = issue.control.parentElement; node; node = node.parentElement) if (node instanceof HTMLDetailsElement) node.open = true;
    pendingErrorFocus.current = issue.control;
    goToStep(issue.step, false);
  }

  function validateDraft(form: HTMLFormElement, currentStep?: number) {
    clearDescriptionValidity(form);
    const next = evaluateDraft(form, locale);
    setEvaluation(next);
    const checked = currentStep === undefined ? [0, 1, 2] : [currentStep];
    setAttempted(previous => [...new Set([...previous, ...checked])]);
    const invalid = [...next.flatMap(item => item.issues), ...remoteIssues].find(issue => checked.includes(issue.step));
    if (!invalid) { setError(null); return true; }
    setError(validation.errors);
    focusIssue(invalid);
    return false;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateDraft(event.currentTarget)) return;
    const data = new FormData(event.currentTarget);
    clearDescriptionValidity(event.currentTarget);
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const nextManifest = buildManifest(data, type, sourceKind, customLicense);
      const next = productId && record
        ? await updateCreatorDraft(productId, record.version, nextManifest)
        : await createCreatorDraft(nextManifest);
      setRecord(next);
      setCheckpoint(null);
      setDirty(false);
      setSaved(true);
      setPreview(nextManifest);
      setLocalStatus(null);
      try { if (storageKey) localStorage.removeItem(storageKey); }
      catch { setLocalStatus(copy.localCleanupError); }
      if (!productId) router.replace(localePath(`/dashboard/studio/listings/${next.id}/edit`, locale));
    } catch (cause) {
      let fieldFocused = false;
      if (cause instanceof ApiError && cause.details?.length && formRef.current) {
        const issues = serverDraftIssues(formRef.current, cause.details);
        setRemoteIssues(issues);
        if (issues[0]) { focusIssue(issues[0]); fieldFocused = true; }
      }
      if (cause instanceof ApiError && cause.code === "LISTING_VERSION_CONFLICT") setError(copy.versionConflict);
      else if (cause instanceof ApiError && cause.code === "VERSION_ALREADY_PUBLISHED") setError(copy.publishedVersionConflict);
      else setError(cause instanceof ApiError ? cause.message : copy.saveError);
      if (!fieldFocused) requestAnimationFrame(() => document.getElementById("draft-errors")?.focus());
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <EditorStatus message={copy.loading} />;
    if (!options || error && !record && productId) return <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">{productId ? copy.editTitle : copy.createTitle}</h1>
      <EditorStatus message={error ?? copy.loadError} error />
      <div className="flex flex-wrap gap-3"><Button onClick={() => { setLoading(true); setError(null); setReload((value) => value + 1); }}>{t.creatorHub.retry}</Button><Link className={buttonVariants({ variant: "secondary" })} href={localePath("/dashboard/studio", locale)}>{copy.back}</Link></div>
    </div>;

  const localized = (value: unknown) => value && typeof value === "object" ? value as Record<string, string> : {};
  const listValue = (value: unknown) => Array.isArray(value) ? value.join("\n") : "";
  const screenshots = Array.isArray(listing.screenshots) ? listing.screenshots as Array<{ url: string; alt: { en: string; fa?: string } }> : [];
  const compatibility = Array.isArray(release.compatibility) ? release.compatibility as Array<{ platform: string; models: string[]; notes?: string }> : [];
  const environmentVariables = Array.isArray(requirements.environmentVariables) ? requirements.environmentVariables as Array<{ name: string; purpose: string; required: boolean; sensitive: boolean }> : [];
  const permissions = Array.isArray(release.permissions) ? release.permissions as Array<{ capability: string; required: boolean; scope?: string; destinations: string[]; purpose: string }> : [];
  const steps = [copy.stepBasics, copy.stepRelease, copy.stepAccess, copy.stepReview];
  const completed = evaluation.map((item, index) => item.requiredComplete && item.issues.length === 0 && !remoteIssues.some(issue => issue.step === index));
  const stepCompletion = [...completed, evaluation.length === 3 && completed.every(Boolean)];
  const visibleIssues = [...evaluation.flatMap((item, index) => attempted.includes(index) ? item.issues : []), ...remoteIssues];
  const primaryLang = locale === "fa" ? "Fa" : "En";
  const otherLang = locale === "fa" ? "En" : "Fa";
  const descriptionOf = localized(listing.description);
  const translationsFilled = Boolean(descriptionOf[otherLang.toLowerCase()] || localized(listing.outcome).fa);
  const defaultMethod = source.kind === sourceKind && stringValue(installation.method) ? stringValue(installation.method) : installMethodFor[sourceKind];
  const moreAboutFilled = translationsFilled || Boolean((Array.isArray(listing.tags) && listing.tags.length) || (listing.communitySlugs as string[] | undefined)?.length || screenshots.length || listing.icon || listing.documentationUrl || listing.supportUrl || listing.issueTrackerUrl);
  const moreRequirementsFilled = Boolean(["runtimes", "accounts", "operatingSystems", "dependencies"].some((key) => Array.isArray(requirements[key as keyof typeof requirements]) && (requirements[key as keyof typeof requirements] as unknown[]).length) || environmentVariables.length);
  const optionalDetailFilled = detailFields[type].some((field) => !isPrimaryDetail(field) && (Array.isArray(details[field.key]) ? (details[field.key] as unknown[]).length > 0 : Boolean(details[field.key])));
  const moreDetailsFilled = optionalDetailFilled || moreRequirementsFilled;
  const renderDetail = (field: DetailField) => field.kind === "stages" ? <DeclarationRows messages={copy} key={`${type}-${field.key}`} name={`detail_${field.key}`} label={locale === "fa" ? field.fa : field.en} help="stages" required={field.required} onChange={markDirty} initialRows={Array.isArray(details[field.key]) ? (details[field.key] as Array<{ name: string; description: string; humanApproval: boolean }>).map((stage) => [stage.name, stage.description, String(stage.humanApproval)]) : []} columns={[{ label: copy.stageName }, { label: copy.stageDescription }, { label: copy.humanApproval, type: "checkbox" }]} /> : <DetailInput key={`${type}-${field.key}`} field={field} locale={locale} value={details[field.key]} platforms={options.platforms.map(item => item.key)} />;
  const platformChoices = options.platforms.map((item) => ({ value: item.key, label: (locale === "fa" && item.nameFa) || item.nameEn || item.key }));
  const permissionChoices = permissionCapabilities.map((key) => ({ value: key, label: permissionLabels[locale][key] ?? key.replaceAll("_", " ") }));
  const installMethod = methodOverride ?? defaultMethod;
  const descriptionField = (lang: "En" | "Fa", hint?: string) => <Field key={lang} label={lang === "En" ? copy.descriptionEn : copy.descriptionFa} hint={hint}>
    <Textarea name={`description${lang}`} defaultValue={descriptionOf[lang.toLowerCase()]} {...(lang === "En" ? { lang: "en", dir: "ltr" } : { dir: "rtl" })} onInput={(event) => clearDescriptionValidity(event.currentTarget.form)} />
  </Field>;
  function nameInput(event: FormEvent<HTMLInputElement>) {
    const slugField = event.currentTarget.form?.elements.namedItem("slug");
    if (!(slugField instanceof HTMLInputElement)) return;
    // Follow the name until the creator edits the web address themselves.
    if (slugField.value === "" || slugField.value === lastAutoSlug.current) {
      lastAutoSlug.current = slugify(event.currentTarget.value);
      slugField.value = lastAutoSlug.current;
    }
  }

    return <div className="mx-auto max-w-6xl pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-4">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" href={localePath("/dashboard/studio", locale)}>
      {locale === "fa" ? <ArrowRight className="size-4" aria-hidden="true" /> : <ArrowLeft className="size-4" aria-hidden="true" />}{copy.back}
    </Link>
    <header className="mt-6 max-w-3xl">
      <h1 className="font-semibold mt-2 text-2xl sm:text-3xl">{productId ? copy.editTitle : copy.createTitle}</h1>
      <p className="mt-3 text-muted-foreground">{copy.intro}</p>
      {record && <p className="mt-3 text-sm text-muted-foreground">{copy.revision.replace("{revision}", String(record.draft?.revision ?? 0)).replace("{version}", String(record.version))}</p>}
    </header>

      <nav className="mt-6 max-w-5xl" aria-label={copy.sections}>
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((title, index) => {
          const attention = index < 3 && (evaluation[index]?.issues.some(issue => !issue.missing || attempted.includes(index)) || remoteIssues.some(issue => issue.step === index));
          const state = attention ? validation.attention : stepCompletion[index] ? index === 3 ? validation.ready : copy.complete : copy.incomplete;
          return <li key={title}><button type="button" onClick={() => goToStep(index)} aria-current={step === index ? "step" : undefined} aria-label={`${title} — ${state}${step === index ? ` — ${validation.current}` : ""}`} className={`flex min-h-14 w-full items-center gap-3 rounded-control border-[length:0.0625rem] px-3 py-2 text-start text-sm transition-colors duration-(--duration-hover) motion-reduce:transition-none ${step === index ? "border-primary bg-primary-soft text-foreground" : "border-border text-muted-foreground hover:bg-surface hover:text-foreground"}`}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-nav font-mono tabular-nums ${stepCompletion[index] ? "bg-action text-action-foreground" : "bg-muted text-foreground"}`} aria-hidden="true">{formatNumber(index + 1, locale)}</span><span className="min-w-0"><span className="block font-medium">{title}</span><span className={`mt-0.5 block text-xs ${attention ? "text-destructive" : "text-muted-foreground"}`}>{state}</span></span>
          </button></li>;
        })}</ol>
      </nav>
      <p className="mt-3 min-h-6 max-w-5xl text-sm text-muted-foreground" role="status">{saving ? copy.saving : dirty ? copy.unsaved : localStatus ?? (saved ? copy.saved : "")}</p>
      {dirty && localStatus && <p role="alert" className="mt-2 text-sm text-destructive">{localStatus}</p>}
      <h2 id="draft-step-heading" tabIndex={-1} className="mt-4 scroll-mt-40 text-lg font-semibold">{copy.stepCounter.replace("{step}", formatNumber(step + 1, locale)).replace("{total}", formatNumber(steps.length, locale))} · {steps[step]}</h2>
      <form ref={formRef} className="mt-4 max-w-5xl space-y-5" noValidate onSubmit={submit} onChange={markDirty}>
      <div data-draft-step="0" hidden={step !== 0} className="space-y-6">
      <FormSection title={copy.identityTitle} intro={copy.identityIntro}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label={copy.nameEn} hint={copy.nameHelp}><Input name="nameEn" required pattern="(?=.*[A-Za-z])[\x20-\x7E]+" defaultValue={localized(listing.name).en} lang="en" dir="ltr" onInput={nameInput} /></Field></div>
          <Field label={copy.itemType} help="itemType"><select name="itemType" required value={type} onChange={(event) => setType(event.target.value as MarketplaceItemTypeKey)} className={selectClass}>
            {itemTypes.map((item) => <option key={item.key} value={item.key}>{locale === "fa" ? item.fa : item.en}</option>)}
          </select></Field>
          <Field label={copy.category}><select name="categorySlug" required defaultValue={stringValue(listing.categorySlug)} className={selectClass}><option value="">{copy.choose}</option>{options.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></Field>
        </div>
        <div className="mt-5"><Field label={copy.outcomeEn}><Input name="outcomeEn" required defaultValue={localized(listing.outcome).en} /></Field></div>
        <div className="mt-5"><Field label={copy.slug} help="slug" hint={hints.slug}><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={stringValue(listing.slug)} dir="ltr" /></Field></div>
        <div className="mt-5">{descriptionField(primaryLang, copy.descriptionRequired)}</div>
      </FormSection>

      <FormDisclosure summary={copy.moreAbout} defaultOpen={moreAboutFilled}>
        {descriptionField(otherLang)}
        <Field label={copy.outcomeFa}><Input name="outcomeFa" defaultValue={localized(listing.outcome).fa} dir="rtl" /></Field>
        <Field label={copy.tags} hint={copy.listHint}><Input name="tags" defaultValue={Array.isArray(listing.tags) ? listing.tags.join(", ") : ""} /></Field>
        <fieldset><legend className="w-full text-sm font-semibold"><span className="flex items-center justify-between gap-2">{copy.communities}<ContextHelp label={copy.communities} topic="communities" /></span></legend><p className="mt-1 text-xs text-muted-foreground">{copy.communitiesHint}</p><div className="mt-3 grid gap-3 sm:grid-cols-2">
          {options.communities.map((community) => <label key={community.slug} className="flex min-h-11 items-start gap-3 rounded-control border p-3 text-sm"><input className="mt-1" type="checkbox" name="communitySlugs" value={community.slug} defaultChecked={(listing.communitySlugs as string[] | undefined)?.includes(community.slug)} /><span><strong className="block">{locale === "fa" ? community.nameFa ?? community.nameEn : community.nameEn}</strong><span className="text-xs text-muted-foreground">{locale === "fa" ? community.descriptionFa ?? community.descriptionEn : community.descriptionEn}</span></span></label>)}
        </div></fieldset>
        <div className="flex items-center gap-3">
            <ProductIcon name={stringValue(localized(listing.name).en) || stringValue(listing.slug) || "?"} iconUrl={stringValue(listing.icon) || null} />
            <div className="min-w-0 flex-1"><Field label={copy.icon} hint={copy.iconHint}><Input name="icon" type="url" inputMode="url" defaultValue={stringValue(listing.icon)} dir="ltr" placeholder="https://avatars.githubusercontent.com/…" /></Field></div>
        </div>
        <DeclarationRows messages={copy} name="screenshots" label={copy.screenshots} onChange={markDirty} initialRows={screenshots.map((item) => [item.url, item.alt.en, item.alt.fa ?? ""])} columns={[{ label: copy.imageUrl, type: "url" }, { label: copy.altEn }, { label: copy.altFa, optional: true }]} />
        <div className="grid gap-5 sm:grid-cols-3"><Field label={copy.documentationUrl}><Input name="documentationUrl" type="url" defaultValue={stringValue(listing.documentationUrl)} dir="ltr" /></Field><Field label={copy.supportUrl}><Input name="supportUrl" type="url" defaultValue={stringValue(listing.supportUrl)} dir="ltr" /></Field><Field label={copy.issueTrackerUrl}><Input name="issueTrackerUrl" type="url" defaultValue={stringValue(listing.issueTrackerUrl)} dir="ltr" /></Field></div>
      </FormDisclosure>

      </div>
      <div data-draft-step="1" hidden={step !== 1} className="space-y-6">
      <FormSection title={copy.releaseTitle} intro={copy.releaseIntro}>
        <Field label={copy.sourceKind} help="source"><select name="sourceKind" value={sourceKind} onChange={(event) => { setSourceKind(event.target.value as SourceKind); setMethodOverride(null); }} className={selectClass}><option value="external_link">{copy.sourceLink}</option><option value="github_repository">GitHub repository</option><option value="github_release">GitHub release</option><option value="npm">npm</option></select></Field>
        <SourceFields key={sourceKind} kind={sourceKind} source={source} copy={copy} />
        <div className="mt-5"><ChoiceRows name="compatibility" label={copy.compatibility} help="compatibility" hint={copy.platformsHint} required messages={copy} onChange={markDirty} choices={platformChoices} initialRows={compatibility.map((item) => [item.platform, item.models.join(", "), item.notes ?? ""])} extras={[{ cell: 1, label: copy.models, optional: true }, { cell: 2, label: copy.notes, optional: true }]} /></div>
        <div className="mt-5"><Field label={copy.installationInstructions} help="installation" hint={copy.lineHint}><Textarea name="installationInstructions" required defaultValue={listValue(installation.instructions)} /></Field></div>
        <div className="mt-5"><Field label={copy.installCommands} help="installation" hint={copy.installCommandsHint}><Textarea name="installCommands" spellCheck={false} dir="ltr" className="font-mono" defaultValue={formatCommands(installation.commands)} /></Field></div>
        <div className="mt-5"><Field label={copy.licenseField} help="license" hint={copy.licenseHint}><Input name="license" required defaultValue={customLicense ? stringValue(license.customUrl) : stringValue(license.identifier)} dir="ltr" onInput={(event) => setCustomLicense(event.currentTarget.value.trim().startsWith("https://"))} /></Field></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label={copy.version} help="version" hint={hints.version}><Input name="releaseVersion" required defaultValue={stringValue(release.version) || (productId ? "" : "1.0.0")} dir="ltr" /></Field>
            <Field label={copy.installationMethod} help="installation"><select name="installationMethod" required value={installMethod} onChange={(event) => setMethodOverride(event.target.value)} className={selectClass}>{["manual", "npm", "git", "download", "container", "hosted"].map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
        <div className="mt-5"><Field label={copy.releaseNotes}><Textarea name="releaseNotes" required defaultValue={stringValue(release.releaseNotes) || (productId ? "" : copy.defaultReleaseNotes)} /></Field></div>
        {["github_repository", "github_release"].includes(sourceKind) && <div className="mt-5"><FormDisclosure summary={copy.moreRelease} defaultOpen={Boolean(productId)}><SourceOptionalFields key={sourceKind} kind={sourceKind} source={source} copy={copy} /></FormDisclosure></div>}
        <input type="hidden" name="releaseDocumentationUrl" defaultValue={stringValue(release.documentationUrl)} />
        <input type="hidden" name="releaseSupportUrl" defaultValue={stringValue(release.supportUrl)} />
      </FormSection>

      </div>
      <div data-draft-step="2" hidden={step !== 2} className="space-y-6">
      <FormSection title={copy.touchesTitle} intro={copy.touchesIntro}>
        <ChoiceRows name="permissions" label={copy.permissions} help="permissions" messages={copy} onChange={markDirty} choices={permissionChoices} initialRows={permissions.map((item) => [item.capability, String(item.required), item.scope ?? "", item.destinations.join(", "), item.purpose])} extras={[{ cell: 4, label: copy.purpose, wide: true }, { cell: 1, label: copy.required, type: "checkbox", defaultValue: "true" }, { cell: 2, label: copy.scope, optional: true }, { cell: 3, label: copy.destinations, optional: true }]} />
      </FormSection>

      <FormSection title={copy.typeDetailsTitle} help="details" intro={copy.typeDetailsIntro}>
          <p className="mb-4 text-sm text-muted-foreground">{hints.public}</p>
          <div className="grid gap-5 sm:grid-cols-2">{detailFields[type].filter(isPrimaryDetail).map(renderDetail)}</div>
      </FormSection>

      <FormDisclosure summary={copy.moreDetails} defaultOpen={moreDetailsFilled}>
        <div className="grid gap-5 sm:grid-cols-2">{detailFields[type].filter((field) => !isPrimaryDetail(field)).map(renderDetail)}</div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label={copy.runtimes} hint={copy.lineHint}><Textarea name="runtimes" defaultValue={listValue(requirements.runtimes)} /></Field><Field label={copy.accounts} hint={copy.lineHint}><Textarea name="accounts" defaultValue={listValue(requirements.accounts)} /></Field><Field label={copy.operatingSystems} hint={copy.lineHint}><Textarea name="operatingSystems" defaultValue={listValue(requirements.operatingSystems)} /></Field><Field label={copy.dependencies} hint={copy.lineHint}><Textarea name="dependencies" defaultValue={listValue(requirements.dependencies)} /></Field></div>
        <DeclarationRows messages={copy} name="environmentVariables" label={copy.environmentVariables} help="environment" hint={hints.environment} onChange={markDirty} initialRows={environmentVariables.map((item) => [item.name, item.purpose, String(item.required), String(item.sensitive)])} columns={[{ label: copy.variableName }, { label: copy.purpose }, { label: copy.required, type: "checkbox" }, { label: copy.sensitive, type: "checkbox" }]} />
      </FormDisclosure>

      </div>

      <div data-draft-step="3" hidden={step !== 3}>
        <FormSection title={copy.reviewTitle} help="review" intro={copy.reviewIntro}>
          {preview && <nav aria-label={validation.edit} className="flex flex-wrap gap-2">{steps.slice(0, 3).map((title, index) => <Button key={title} type="button" variant="ghost" onClick={() => goToStep(index)}>{validation.edit} {title}</Button>)}</nav>}
          {!preview && <div className="space-y-3"><p className="text-sm text-muted-foreground">{validation.reviewIncomplete}</p><div className="flex flex-wrap gap-2">{steps.slice(0, 3).map((title, index) => <Button key={title} type="button" variant="secondary" onClick={() => goToStep(index)}>{validation.edit} {title}</Button>)}</div></div>}
          {preview && <div className="mt-5 space-y-4" role="region" aria-label={copy.preview}>
            <h3 className="break-words text-xl font-semibold"><bdi>{preview.listing.name.en}</bdi></h3>
            <p>{locale === "fa" ? preview.listing.outcome.fa ?? preview.listing.outcome.en : preview.listing.outcome.en}</p>
            <p className="whitespace-pre-wrap">{locale === "fa" ? preview.listing.description.fa ?? preview.listing.description.en : preview.listing.description.en ?? preview.listing.description.fa}</p>
            <dl className="space-y-3 break-words">
              <div><dt className="font-semibold">{copy.sourceKind}</dt><dd><bdi dir="ltr">{Object.values(preview.release.source).slice(1).join(" · ")}</bdi></dd></div>
              <div><dt className="font-semibold">{copy.compatibility}</dt><dd>{preview.release.compatibility.map((item) => `${item.platform.replaceAll("_", " ")}: ${item.models.join(", ")}`).join("; ")}</dd></div>
              <div><dt className="font-semibold">{copy.permissions}</dt><dd>{preview.release.permissions.length ? <ul>{preview.release.permissions.map((item, index) => <li key={index}>{item.capability.replaceAll("_", " ")}: {item.purpose} ({item.required ? copy.required : copy.optional}) <bdi dir="ltr">{item.scope} {item.destinations.join(", ")}</bdi></li>)}</ul> : copy.noDeclarations}</dd></div>
              <div><dt className="font-semibold">{copy.environmentVariables}</dt><dd>{preview.release.requirements.environmentVariables.length ? <ul>{preview.release.requirements.environmentVariables.map((item, index) => <li key={index}><bdi dir="ltr">{item.name}</bdi>: {item.purpose} ({item.required ? copy.required : copy.optional}{item.sensitive ? `, ${copy.sensitive}` : ""})</li>)}</ul> : copy.noDeclarations}</dd></div>
              <div><dt className="font-semibold">{copy.licenseTitle}</dt><dd><bdi dir="ltr">{Object.values(preview.release.license).join("")}</bdi></dd></div>
              {preview.listing.icon && <div><dt className="font-semibold">{copy.icon}</dt><dd className="break-all"><bdi dir="ltr">{preview.listing.icon}</bdi></dd></div>}
              <div><dt className="font-semibold">{copy.screenshots}</dt><dd>{preview.listing.screenshots.length ? <ul>{preview.listing.screenshots.map((item, index) => <li key={index} className="break-all"><bdi dir="ltr">{item.url}</bdi> — {locale === "fa" ? item.alt.fa ?? item.alt.en : item.alt.en}</li>)}</ul> : copy.noDeclarations}</dd></div>
            </dl>
            <p className="text-sm text-muted-foreground">{copy.previewComplete}</p>
          </div>}
        </FormSection>
      </div>

        <DraftFieldErrors issues={visibleIssues} />
        {error && <p id="draft-errors" tabIndex={-1} className="flex scroll-mt-40 items-start gap-2 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
        {saved && <p className="text-sm text-success" role="status">{copy.saved}</p>}
        <div data-draft-actions data-help-anchor className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex flex-wrap items-center justify-between gap-3 rounded-card border bg-surface p-3 shadow-panel lg:bottom-4">
          <div className="flex gap-2"><Button type="button" variant="secondary" disabled={step === 0 || saving} onClick={() => goToStep(step - 1)}>{copy.previousStep}</Button>{step < lastStep && <Button type="button" disabled={saving} onClick={() => { if (formRef.current && validateDraft(formRef.current, step)) goToStep(step + 1); }}>{copy.nextStep}</Button>}</div>
          <div className="flex flex-wrap gap-1"><ContextHelp label={`${copy.saveLater} / ${copy.save}`} topic="saves" /><Link className={buttonVariants({ variant: "ghost" })} href={localePath("/dashboard/studio", locale)}>{copy.cancel}</Link><Button type="button" variant="secondary" disabled={saving || !storageKey} onClick={saveForLater}>{localStatus === copy.localSaved ? <><Check className="size-4" aria-hidden="true" />{copy.savedLater}</> : copy.saveLater}</Button>{step === lastStep && <Button disabled={saving}><Save className="size-4" aria-hidden="true" />{saving ? copy.saving : copy.save}</Button>}</div>
      </div>
    </form>
  </div>;
}

function SourceFields({ kind, source, copy }: { kind: SourceKind; source: Record<string, unknown>; copy: Record<string, string> }) {
  const { locale } = useLocale();
  const hints = helpHints[locale];
  if (kind === "external_link") return <LinkSourceFields source={source} copy={copy} />;
  if (kind === "npm") return <div className="mt-5 grid gap-5 sm:grid-cols-3"><Field label={copy.packageName} help="npmRef"><Input name="packageName" required defaultValue={stringValue(source.packageName)} dir="ltr" /></Field><Field label={copy.npmVersion} help="npmRef" hint={hints.npmVersion}><Input name="npmVersion" required defaultValue={stringValue(source.version)} dir="ltr" /></Field><Field label={copy.integrity} help="integrity" hint={hints.integrity}><Input name="integrity" required defaultValue={stringValue(source.integrity)} dir="ltr" /></Field></div>;
  return <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={copy.repositoryUrl} help="source"><Input name="repositoryUrl" type="url" required defaultValue={stringValue(source.repositoryUrl)} dir="ltr" /></Field>{kind === "github_repository" ? <Field label={copy.commitSha} help="githubRef" hint={hints.sha}><Input name="commitSha" required minLength={40} maxLength={40} defaultValue={stringValue(source.commitSha)} dir="ltr" /></Field> : <><Field label={copy.releaseTag} help="githubRef" hint={hints.sha}><Input name="releaseTag" required defaultValue={stringValue(source.tag)} dir="ltr" /></Field><Field label={copy.releaseCommitSha} help="githubRef" hint={hints.sha}><Input name="releaseCommitSha" required minLength={40} maxLength={40} defaultValue={stringValue(source.releaseCommitSha)} dir="ltr" /></Field><Field label={copy.assetName} help="source"><Input name="assetName" required defaultValue={stringValue(source.assetName)} dir="ltr" /></Field></>}</div>;
}

function LinkSourceFields({ source, copy }: { source: Record<string, unknown>; copy: Record<string, string> }) {
  const [authorship, setAuthorship] = useState(stringValue(source.authorship) || "own");
  return <div className="mt-5 grid gap-5 sm:grid-cols-2">
    <Field label={copy.projectUrl} hint={copy.projectUrlHint}><Input name="projectUrl" type="url" required defaultValue={stringValue(source.url)} dir="ltr" /></Field>
    <Field label={copy.authorship}><select name="authorship" value={authorship} onChange={(event) => setAuthorship(event.target.value)} className={selectClass}><option value="own">{copy.authorshipOwn}</option><option value="third_party">{copy.authorshipThirdParty}</option></select></Field>
    {authorship === "third_party" && <Field label={copy.originalAuthor}><Input name="originalAuthor" required defaultValue={stringValue(source.originalAuthor)} /></Field>}
  </div>;
}

// Source fields the API treats as optional live with the other release details.
function SourceOptionalFields({ kind, source, copy }: { kind: SourceKind; source: Record<string, unknown>; copy: Record<string, string> }) {
  const { locale } = useLocale();
  const hints = helpHints[locale];
  if (kind === "github_repository") return <Field label={copy.repositoryPath} help="repositoryPath"><Input name="repositoryPath" defaultValue={stringValue(source.path)} dir="ltr" /></Field>;
  if (kind === "github_release") return <Field label={copy.assetDigest} help="integrity" hint={hints.assetDigest}><Input name="assetDigest" defaultValue={stringValue(source.assetDigest)} dir="ltr" /></Field>;
  return null;
}

function DetailInput({ field, locale, value, platforms }: { field: DetailField; locale: "en" | "fa"; value: unknown; platforms: string[] }) {
  const label = locale === "fa" ? field.fa : field.en;
  const help: HelpTopic | undefined = field.key === "entryPath" || field.key === "entryPaths" ? "entryPath" : field.key === "transport" ? "transport" : field.key === "authentication" || field.key === "authenticationMethod" ? "authentication" : undefined;
  if (field.kind === "boolean") return <label className="flex min-h-11 items-center gap-3 self-end rounded-control border px-3 text-sm font-medium"><input name={`detail_${field.key}`} type="checkbox" defaultChecked={Boolean(value)} />{label}</label>;
  if (field.key === "hostPlatform") return <Field label={label}><select name={`detail_${field.key}`} required={field.required} defaultValue={stringValue(value)} data-draft-allowed={platforms.join(",")} className={selectClass}><option value="">{locale === "fa" ? "انتخاب سکو" : "Choose a platform"}</option>{stringValue(value) && !platforms.includes(stringValue(value)) && <option value={stringValue(value)}>{stringValue(value)}</option>}{platforms.map(platform => <option key={platform} value={platform}>{platform.replaceAll("_", " ")}</option>)}</select></Field>;
  if (field.kind === "select") return <Field label={label} help={help}><select name={`detail_${field.key}`} required={field.required} defaultValue={stringValue(value)} className={selectClass}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></Field>;
  const defaultValue = field.kind === "list" ? (Array.isArray(value) ? value.join("\n") : "") : field.kind === "stages" && Array.isArray(value) ? (value as Array<{ name: string; description: string; humanApproval: boolean }>).map((stage) => `${stage.name} | ${stage.description} | ${stage.humanApproval}`).join("\n") : stringValue(value);
  if (field.kind === "textarea" || field.kind === "list" || field.kind === "stages") return <Field label={label} help={help}><Textarea name={`detail_${field.key}`} data-draft-list={field.kind === "list" || undefined} data-draft-allowed={field.key === "effects" ? permissionCapabilities.join(",") : undefined} required={field.required} defaultValue={defaultValue} /></Field>;
  return <Field label={label} help={help}><Input name={`detail_${field.key}`} required={field.required} defaultValue={defaultValue} dir="ltr" /></Field>;
}

function FormSection({ title, intro, help, children }: { title: string; intro: string; help?: HelpTopic; children: React.ReactNode }) {
  return <section id={title.replaceAll(" ", "-")} className="scroll-mt-40 rounded-card border border-border bg-surface p-5 shadow-panel sm:p-6"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold">{title}</h2>{help && <ContextHelp label={title} topic={help} />}</div><p className="mt-1 text-sm text-muted-foreground">{intro}</p><div className="mt-6">{children}</div></section>;
}
function Field({ label, hint, help, children }: { label: string; hint?: string; help?: HelpTopic; children: React.ReactNode }) {
  const id = useId();
  const field = isValidElement<{ required?: boolean; id?: string; "aria-describedby"?: string }>(children) ? children : null;
  return <div className="text-sm" data-help-anchor>
    <div className="flex min-h-11 items-center justify-between gap-2"><label htmlFor={id} className="block font-medium">{label}{field?.props.required && <span aria-hidden="true"> *</span>}</label>{help && <ContextHelp label={label} topic={help} />}</div>
    {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    <div className="mt-2" data-draft-feedback>{field ? cloneElement(field, { id, "aria-describedby": hint ? `${id}-hint` : undefined }) : children}</div>
  </div>;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className="min-h-28 w-full rounded-control border-[length:0.0625rem] border-input bg-surface px-3 py-3 text-base placeholder:text-muted-foreground/75 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />; }
function EditorStatus({ message, error = false }: { message: string; error?: boolean }) { return <div className="mx-auto max-w-xl rounded-card border bg-surface p-8"><p className={error ? "text-destructive" : "text-muted-foreground"} role={error ? "alert" : "status"}>{message}</p></div>; }
const selectClass = "min-h-11 w-full rounded-control border-[length:0.0625rem] border-input bg-surface px-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";
const stringValue = (value: unknown) => typeof value === "string" ? value : "";
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const optionalText = (data: FormData, key: string) => text(data, key) || undefined;
/** `os/label: command` per line (label optional); a bare line is a command for any system. Commands keep their commas. */
const commandLine = /^([a-z]+)(?:\/([^:]{1,40}))?:\s+(.+)$/iu;
const parseCommands = (value: string) => value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).map((line) => {
  const match = commandLine.exec(line);
  return match ? { os: match[1].toLowerCase(), ...(match[2]?.trim() ? { label: match[2].trim() } : {}), command: match[3].trim() } : { os: "any", command: line };
});
const formatCommands = (value: unknown) => Array.isArray(value)
  ? (value as Array<{ os?: string; label?: string; command?: string }>).map((item) => `${item.os ?? "any"}${item.label ? `/${item.label}` : ""}: ${item.command ?? ""}`).join("\n")
  : "";
const lines = (value: string) => value.split(/\r?\n|,/u).map((item) => item.trim()).filter(Boolean);
const rows = (value: string): string[][] => value ? JSON.parse(value) as string[][] : [];
const bool = (value: string | undefined) => value === "true";

function localized(en: string, fa: string) { return fa ? { en, fa } : { en }; }
function optionalLocalized(en: string, fa: string) { return { ...(en ? { en } : {}), ...(fa ? { fa } : {}) }; }

export function buildManifest(data: FormData, type: MarketplaceItemTypeKey, sourceKind: SourceKind, customLicense: boolean) {
  const source = sourceKind === "external_link" ? {
    kind: sourceKind, url: text(data, "projectUrl"), authorship: text(data, "authorship"), ...(text(data, "authorship") === "third_party" ? { originalAuthor: text(data, "originalAuthor") } : {}),
  } : sourceKind === "github_repository" ? {
    kind: sourceKind, repositoryUrl: text(data, "repositoryUrl"), commitSha: text(data, "commitSha"), ...(optionalText(data, "repositoryPath") ? { path: optionalText(data, "repositoryPath") } : {}),
  } : sourceKind === "github_release" ? {
    kind: sourceKind, repositoryUrl: text(data, "repositoryUrl"), tag: text(data, "releaseTag"), releaseCommitSha: text(data, "releaseCommitSha"), assetName: text(data, "assetName"), ...(optionalText(data, "assetDigest") ? { assetDigest: optionalText(data, "assetDigest") } : {}),
  } : { kind: sourceKind, packageName: text(data, "packageName"), version: text(data, "npmVersion"), integrity: text(data, "integrity") };
  const typeDetails = Object.fromEntries(detailFields[type].flatMap<[string, unknown]>((field) => {
    const key = `detail_${field.key}`;
    if (field.kind === "boolean") return [[field.key, data.has(key)]];
    if (field.kind === "list") return [[field.key, lines(text(data, key))]];
    if (field.kind === "stages") return [[field.key, rows(text(data, key)).map(([name, description, humanApproval]) => ({ name, description, humanApproval: bool(humanApproval) }))]];
    const value = text(data, key);
    return !field.required && !value ? [] : [[field.key, value]];
  }));
  return {
    manifestVersion: 1,
    type,
    listing: {
      slug: text(data, "slug"), name: { en: text(data, "nameEn") }, outcome: localized(text(data, "outcomeEn"), text(data, "outcomeFa")), description: optionalLocalized(text(data, "descriptionEn"), text(data, "descriptionFa")),
      categorySlug: text(data, "categorySlug"), communitySlugs: data.getAll("communitySlugs").map(String), tags: lines(text(data, "tags")),
      screenshots: rows(text(data, "screenshots")).map(([url, altEn, altFa]) => ({ url, alt: localized(altEn, altFa) })),
      ...(optionalText(data, "icon") ? { icon: optionalText(data, "icon") } : {}),
      ...(optionalText(data, "documentationUrl") ? { documentationUrl: optionalText(data, "documentationUrl") } : {}),
      ...(optionalText(data, "supportUrl") ? { supportUrl: optionalText(data, "supportUrl") } : {}),
      ...(optionalText(data, "issueTrackerUrl") ? { issueTrackerUrl: optionalText(data, "issueTrackerUrl") } : {}),
    },
    release: {
      version: text(data, "releaseVersion"), source, releaseNotes: text(data, "releaseNotes"),
      compatibility: rows(text(data, "compatibility")).map(([platform, models, notes]) => ({ platform, models: lines(models), ...(notes ? { notes } : {}) })),
      installation: { method: text(data, "installationMethod"), instructions: lines(text(data, "installationInstructions")), ...(text(data, "installCommands") ? { commands: parseCommands(text(data, "installCommands")) } : {}) },
      requirements: {
        runtimes: lines(text(data, "runtimes")), accounts: lines(text(data, "accounts")), operatingSystems: lines(text(data, "operatingSystems")), dependencies: lines(text(data, "dependencies")),
        environmentVariables: rows(text(data, "environmentVariables")).map(([name, purpose, required, sensitive]) => ({ name, purpose, required: bool(required), sensitive: bool(sensitive) })),
      },
      permissions: rows(text(data, "permissions")).map(([capability, required, scope, destinations, purpose]) => ({ capability, required: required === "" ? true : bool(required), ...(scope ? { scope } : {}), destinations: lines(destinations), purpose })),
      license: customLicense ? { customUrl: text(data, "license") } : { identifier: text(data, "license") },
      ...(optionalText(data, "releaseDocumentationUrl") ? { documentationUrl: optionalText(data, "releaseDocumentationUrl") } : {}),
      ...(optionalText(data, "releaseSupportUrl") ? { supportUrl: optionalText(data, "releaseSupportUrl") } : {}),
    },
    typeDetails,
  };
}
