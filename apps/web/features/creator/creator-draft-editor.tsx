"use client";

import { cloneElement, FormEvent, isValidElement, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { ApiError, createCreatorDraft, getCreatorDraft, getMarketplaceDraftOptions, getMarketplaceItemTypes, updateCreatorDraft } from "@/lib/api";
import type { MarketplaceDraftOptions, MarketplaceDraftRecord, MarketplaceItemType, MarketplaceItemTypeKey } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { creatorWorkspace } from "./workspace-copy";
import { localePath } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeclarationRows } from "./declaration-rows";

type SourceKind = "github_repository" | "github_release" | "npm";
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

const permissionCapabilities = ["filesystem_read", "filesystem_write", "process_execution", "network_access", "environment_access", "secret_access", "browser_automation", "external_account_access", "persistent_storage", "background_execution", "code_modification", "telemetry"];

export function CreatorDraftEditor({ productId }: { productId?: string }) {
  const { locale, t } = useLocale();
  const copy = { ...t.creatorDraft, ...creatorWorkspace[locale].creatorDraft };
  const router = useRouter();
  const [options, setOptions] = useState<MarketplaceDraftOptions | null>(null);
  const [itemTypes, setItemTypes] = useState<MarketplaceItemType[]>([]);
  const [record, setRecord] = useState<MarketplaceDraftRecord | null>(null);
  const [type, setType] = useState<MarketplaceItemTypeKey>("skill");
  const [sourceKind, setSourceKind] = useState<SourceKind>("github_repository");
  const [customLicense, setCustomLicense] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reload, setReload] = useState(0);
  const [preview, setPreview] = useState<ReturnType<typeof buildManifest> | null>(null);
  function markDirty() { setDirty(true); setSaved(false); setPreview(null); }

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
        if (nextSource === "github_repository" || nextSource === "github_release" || nextSource === "npm") setSourceKind(nextSource);
        setCustomLicense(Boolean(manifest?.release?.license?.customUrl));
      }
    }).catch((cause) => {
      if (active) setError(cause instanceof ApiError ? cause.message : copy.loadError);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [copy.loadError, productId, reload]);

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

  const manifest = useMemo(() => record?.draft?.content as ManifestLike | undefined, [record]);
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!text(data, "descriptionEn") && !text(data, "descriptionFa")) {
      const fieldName = locale === "fa" ? "descriptionFa" : "descriptionEn";
      const field = event.currentTarget.elements.namedItem(fieldName);
      if (field instanceof HTMLTextAreaElement) {
        field.setCustomValidity(copy.descriptionRequired);
        field.reportValidity();
        field.focus();
      }
      setError(copy.descriptionRequired);
      return;
    }
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
      setDirty(false);
      setSaved(true);
      if (!productId) router.replace(localePath(`/dashboard/studio/listings/${next.id}/edit`, locale));
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === "LISTING_VERSION_CONFLICT") setError(copy.versionConflict);
      else if (cause instanceof ApiError && cause.code === "VERSION_ALREADY_PUBLISHED") setError(copy.publishedVersionConflict);
      else setError(cause instanceof ApiError ? cause.message : copy.saveError);
      document.getElementById("draft-errors")?.focus();
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

    return <div className="mx-auto max-w-5xl pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-4">
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground" href={localePath("/dashboard/studio", locale)}>
      {locale === "fa" ? <ArrowRight className="size-4" aria-hidden="true" /> : <ArrowLeft className="size-4" aria-hidden="true" />}{copy.back}
    </Link>
    <header className="mt-6 max-w-3xl">
      <h1 className="font-semibold mt-2 text-2xl sm:text-3xl">{productId ? copy.editTitle : copy.createTitle}</h1>
      <p className="mt-3 text-muted-foreground">{copy.intro}</p>
      {record && <p className="mt-3 text-sm text-muted-foreground">{copy.revision.replace("{revision}", String(record.draft?.revision ?? 0)).replace("{version}", String(record.version))}</p>}
    </header>

      <nav className="mt-6 flex flex-wrap gap-x-4" aria-label={copy.sections}>
        {[copy.identityTitle, copy.presentationTitle, copy.releaseTitle, copy.requirementsTitle, copy.licenseTitle, copy.typeDetailsTitle, copy.reviewTitle].map((title) => <a key={title} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4" href={`#${encodeURIComponent(title.replaceAll(" ", "-"))}`}>{title}</a>)}
      </nav>
      <p className="mt-2 text-sm text-muted-foreground" role="status">{saving ? copy.saving : dirty ? copy.unsaved : saved ? copy.saved : copy.intro}</p>
      <form className="mt-6 space-y-6" onSubmit={submit} onChange={markDirty}>
      <FormSection title={copy.identityTitle} intro={copy.identityIntro}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={copy.slug}><Input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={stringValue(listing.slug)} dir="ltr" /></Field>
            <Field label={copy.itemType}><select name="itemType" required value={type} onChange={(event) => setType(event.target.value as MarketplaceItemTypeKey)} className={selectClass}>
            {itemTypes.map((item) => <option key={item.key} value={item.key}>{locale === "fa" ? item.fa : item.en}</option>)}
          </select></Field>
          <Field label={copy.nameEn} hint={copy.nameHelp}><Input name="nameEn" required pattern="(?=.*[A-Za-z])[\x20-\x7E]+" defaultValue={localized(listing.name).en} lang="en" dir="ltr" /></Field>
          <Field label={copy.outcomeEn}><Input name="outcomeEn" required defaultValue={localized(listing.outcome).en} /></Field>
          <Field label={copy.outcomeFa}><Input name="outcomeFa" defaultValue={localized(listing.outcome).fa} dir="rtl" /></Field>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Field label={copy.descriptionEn} hint={copy.descriptionRequired}><Textarea name="descriptionEn" defaultValue={localized(listing.description).en} lang="en" dir="ltr" onInput={(event) => clearDescriptionValidity(event.currentTarget.form)} /></Field>
            <Field label={copy.descriptionFa} hint={copy.descriptionRequired}><Textarea name="descriptionFa" defaultValue={localized(listing.description).fa} dir="rtl" onInput={(event) => clearDescriptionValidity(event.currentTarget.form)} /></Field>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label={copy.category}><select name="categorySlug" required defaultValue={stringValue(listing.categorySlug)} className={selectClass}><option value="">{copy.choose}</option>{options.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></Field>
          <Field label={copy.tags} hint={copy.listHint}><Input name="tags" required defaultValue={Array.isArray(listing.tags) ? listing.tags.join(", ") : ""} /></Field>
        </div>
        <fieldset className="mt-5"><legend className="text-sm font-semibold">{copy.communities}</legend><p className="mt-1 text-xs text-muted-foreground">{copy.communitiesHint}</p><div className="mt-3 grid gap-3 sm:grid-cols-2">
          {options.communities.map((community) => <label key={community.slug} className="flex min-h-11 items-start gap-3 rounded-none border p-3 text-sm"><input className="mt-1" type="checkbox" name="communitySlugs" value={community.slug} defaultChecked={(listing.communitySlugs as string[] | undefined)?.includes(community.slug)} /><span><strong className="block">{locale === "fa" ? community.nameFa ?? community.nameEn : community.nameEn}</strong><span className="text-xs text-muted-foreground">{locale === "fa" ? community.descriptionFa ?? community.descriptionEn : community.descriptionEn}</span></span></label>)}
        </div></fieldset>
      </FormSection>

      <FormSection title={copy.presentationTitle} intro={copy.presentationIntro}>
          <DeclarationRows name="screenshots" label={copy.screenshots} onChange={markDirty} initialRows={screenshots.map((item) => [item.url, item.alt.en, item.alt.fa ?? ""])} columns={[{ label: copy.imageUrl, type: "url" }, { label: copy.altEn }, { label: copy.altFa, optional: true }]} />
        <div className="mt-5 grid gap-5 sm:grid-cols-3"><Field label={copy.documentationUrl}><Input name="documentationUrl" type="url" defaultValue={stringValue(listing.documentationUrl)} dir="ltr" /></Field><Field label={copy.supportUrl}><Input name="supportUrl" type="url" defaultValue={stringValue(listing.supportUrl)} dir="ltr" /></Field><Field label={copy.issueTrackerUrl}><Input name="issueTrackerUrl" type="url" defaultValue={stringValue(listing.issueTrackerUrl)} dir="ltr" /></Field></div>
      </FormSection>

      <FormSection title={copy.releaseTitle} intro={copy.releaseIntro}>
        <div className="grid gap-5 sm:grid-cols-2"><Field label={copy.version}><Input name="releaseVersion" required defaultValue={stringValue(release.version)} dir="ltr" /></Field><Field label={copy.sourceKind}><select name="sourceKind" value={sourceKind} onChange={(event) => setSourceKind(event.target.value as SourceKind)} className={selectClass}><option value="github_repository">GitHub repository</option><option value="github_release">GitHub release</option><option value="npm">npm</option></select></Field></div>
        <SourceFields key={sourceKind} kind={sourceKind} source={source} copy={copy} />
        <div className="mt-5"><Field label={copy.releaseNotes}><Textarea name="releaseNotes" required defaultValue={stringValue(release.releaseNotes)} /></Field></div>
          <DeclarationRows name="compatibility" label={copy.compatibility} required onChange={markDirty} initialRows={compatibility.map((item) => [item.platform, item.models.join(", "), item.notes ?? ""])} columns={[{ label: copy.platform, options: options.platforms.map((item) => item.key) }, { label: copy.models }, { label: copy.notes, optional: true }]} />
        <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={copy.installationMethod}><select name="installationMethod" required defaultValue={stringValue(installation.method) || "manual"} className={selectClass}>{["manual", "npm", "git", "download", "container", "hosted"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label={copy.installationInstructions} hint={copy.lineHint}><Textarea name="installationInstructions" required defaultValue={listValue(installation.instructions)} /></Field></div>
      </FormSection>

      <FormSection title={copy.requirementsTitle} intro={copy.requirementsIntro}>
        <div className="grid gap-5 sm:grid-cols-2"><Field label={copy.runtimes} hint={copy.lineHint}><Textarea name="runtimes" defaultValue={listValue(requirements.runtimes)} /></Field><Field label={copy.accounts} hint={copy.lineHint}><Textarea name="accounts" defaultValue={listValue(requirements.accounts)} /></Field><Field label={copy.operatingSystems} hint={copy.lineHint}><Textarea name="operatingSystems" defaultValue={listValue(requirements.operatingSystems)} /></Field><Field label={copy.dependencies} hint={copy.lineHint}><Textarea name="dependencies" defaultValue={listValue(requirements.dependencies)} /></Field></div>
          <DeclarationRows name="environmentVariables" label={copy.environmentVariables} onChange={markDirty} initialRows={environmentVariables.map((item) => [item.name, item.purpose, String(item.required), String(item.sensitive)])} columns={[{ label: copy.variableName }, { label: copy.purpose }, { label: copy.required, type: "checkbox" }, { label: copy.sensitive, type: "checkbox" }]} />
          <DeclarationRows name="permissions" label={copy.permissions} onChange={markDirty} initialRows={permissions.map((item) => [item.capability, String(item.required), item.scope ?? "", item.destinations.join(", "), item.purpose])} columns={[{ label: copy.capability, options: permissionCapabilities }, { label: copy.required, type: "checkbox" }, { label: copy.scope, optional: true }, { label: copy.destinations, optional: true }, { label: copy.purpose }]} />
      </FormSection>

      <FormSection title={copy.licenseTitle} intro={copy.licenseIntro}>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium"><input type="checkbox" checked={customLicense} onChange={(event) => setCustomLicense(event.target.checked)} />{copy.customLicense}</label>
        <div className="mt-4"><Field label={customLicense ? copy.customLicenseUrl : copy.licenseIdentifier}><Input key={customLicense ? "custom" : "spdx"} name="license" required defaultValue={customLicense ? stringValue(license.customUrl) : stringValue(license.identifier)} dir="ltr" /></Field></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={copy.releaseDocumentationUrl}><Input name="releaseDocumentationUrl" type="url" defaultValue={stringValue(release.documentationUrl)} dir="ltr" /></Field><Field label={copy.releaseSupportUrl}><Input name="releaseSupportUrl" type="url" defaultValue={stringValue(release.supportUrl)} dir="ltr" /></Field></div>
      </FormSection>

      <FormSection title={copy.typeDetailsTitle} intro={copy.typeDetailsIntro}>
          <div className="grid gap-5 sm:grid-cols-2">{detailFields[type].map((field) => field.kind === "stages" ? <DeclarationRows key={`${type}-${field.key}`} name={`detail_${field.key}`} label={locale === "fa" ? field.fa : field.en} required={field.required} onChange={markDirty} initialRows={Array.isArray(details[field.key]) ? (details[field.key] as Array<{ name: string; description: string; humanApproval: boolean }>).map((stage) => [stage.name, stage.description, String(stage.humanApproval)]) : []} columns={[{ label: copy.stageName }, { label: copy.stageDescription }, { label: copy.humanApproval, type: "checkbox" }]} /> : <DetailInput key={`${type}-${field.key}`} field={field} locale={locale} value={details[field.key]} />)}</div>
      </FormSection>

        <FormSection title={copy.reviewTitle} intro={copy.reviewIntro}>
          <Button type="button" variant="secondary" onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form?.reportValidity()) return;
            const data = new FormData(form);
            if (!text(data, "descriptionEn") && !text(data, "descriptionFa")) { setError(copy.descriptionRequired); return; }
            setPreview(buildManifest(data, type, sourceKind, customLicense));
          }}>{copy.preview}</Button>
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
              <div><dt className="font-semibold">{copy.screenshots}</dt><dd>{preview.listing.screenshots.length ? <ul>{preview.listing.screenshots.map((item, index) => <li key={index} className="break-all"><bdi dir="ltr">{item.url}</bdi> — {locale === "fa" ? item.alt.fa ?? item.alt.en : item.alt.en}</li>)}</ul> : copy.noDeclarations}</dd></div>
            </dl>
            <p className="text-sm text-muted-foreground">{copy.previewComplete}</p>
          </div>}
        </FormSection>

        {error && <p id="draft-errors" tabIndex={-1} className="flex scroll-mt-40 items-start gap-2 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p>}
        {saved && <p className="text-sm text-success" role="status">{copy.saved}</p>}
        <div data-draft-actions className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex justify-end gap-3 border bg-surface p-4 lg:bottom-4">
        <div className="flex gap-3"><Link className={buttonVariants({ variant: "secondary" })} href={localePath("/dashboard/studio", locale)}>{copy.cancel}</Link><Button disabled={saving}><Save className="size-4" aria-hidden="true" />{saving ? copy.saving : copy.save}</Button></div>
      </div>
    </form>
  </div>;
}

function SourceFields({ kind, source, copy }: { kind: SourceKind; source: Record<string, unknown>; copy: Record<string, string> }) {
  if (kind === "npm") return <div className="mt-5 grid gap-5 sm:grid-cols-3"><Field label={copy.packageName}><Input name="packageName" required defaultValue={stringValue(source.packageName)} dir="ltr" /></Field><Field label={copy.npmVersion}><Input name="npmVersion" required defaultValue={stringValue(source.version)} dir="ltr" /></Field><Field label={copy.integrity}><Input name="integrity" required defaultValue={stringValue(source.integrity)} dir="ltr" /></Field></div>;
  return <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={copy.repositoryUrl}><Input name="repositoryUrl" type="url" required defaultValue={stringValue(source.repositoryUrl)} dir="ltr" /></Field>{kind === "github_repository" ? <><Field label={copy.commitSha}><Input name="commitSha" required minLength={40} maxLength={40} defaultValue={stringValue(source.commitSha)} dir="ltr" /></Field><Field label={copy.repositoryPath}><Input name="repositoryPath" defaultValue={stringValue(source.path)} dir="ltr" /></Field></> : <><Field label={copy.releaseTag}><Input name="releaseTag" required defaultValue={stringValue(source.tag)} dir="ltr" /></Field><Field label={copy.releaseCommitSha}><Input name="releaseCommitSha" required minLength={40} maxLength={40} defaultValue={stringValue(source.releaseCommitSha)} dir="ltr" /></Field><Field label={copy.assetName}><Input name="assetName" required defaultValue={stringValue(source.assetName)} dir="ltr" /></Field><Field label={copy.assetDigest}><Input name="assetDigest" defaultValue={stringValue(source.assetDigest)} dir="ltr" /></Field></>}</div>;
}

function DetailInput({ field, locale, value }: { field: DetailField; locale: "en" | "fa"; value: unknown }) {
  const label = locale === "fa" ? field.fa : field.en;
  if (field.kind === "boolean") return <label className="flex min-h-11 items-center gap-3 self-end rounded-none border px-3 text-sm font-medium"><input name={`detail_${field.key}`} type="checkbox" defaultChecked={Boolean(value)} />{label}</label>;
  if (field.kind === "select") return <Field label={label}><select name={`detail_${field.key}`} required={field.required} defaultValue={stringValue(value)} className={selectClass}>{field.options?.map((option) => <option key={option}>{option}</option>)}</select></Field>;
  const defaultValue = field.kind === "list" ? (Array.isArray(value) ? value.join("\n") : "") : field.kind === "stages" && Array.isArray(value) ? (value as Array<{ name: string; description: string; humanApproval: boolean }>).map((stage) => `${stage.name} | ${stage.description} | ${stage.humanApproval}`).join("\n") : stringValue(value);
  if (field.kind === "textarea" || field.kind === "list" || field.kind === "stages") return <Field label={label}><Textarea name={`detail_${field.key}`} required={field.required} defaultValue={defaultValue} /></Field>;
  return <Field label={label}><Input name={`detail_${field.key}`} required={field.required} defaultValue={defaultValue} dir="ltr" /></Field>;
}

function FormSection({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <section id={title.replaceAll(" ", "-")} className="scroll-mt-40 border bg-surface p-5 sm:p-7"><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{intro}</p><div className="mt-6">{children}</div></section>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const id = useId();
  const field = isValidElement<{ required?: boolean; id?: string; "aria-describedby"?: string }>(children) ? children : null;
  return <div className="text-sm">
    <label htmlFor={id} className="block font-medium">{label}{field?.props.required && <span aria-hidden="true"> *</span>}</label>
    {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    <div className="mt-2">{field ? cloneElement(field, { id, "aria-describedby": hint ? `${id}-hint` : undefined }) : children}</div>
  </div>;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className="min-h-28 w-full rounded-none border border-input bg-surface px-3 py-3 text-sm placeholder:text-muted-foreground/75 hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20" />; }
function EditorStatus({ message, error = false }: { message: string; error?: boolean }) { return <div className="mx-auto max-w-xl rounded-none border bg-surface p-8"><p className={error ? "text-destructive" : "text-muted-foreground"} role={error ? "alert" : "status"}>{message}</p></div>; }
const selectClass = "min-h-11 w-full rounded-none border border-input bg-surface px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20";
const stringValue = (value: unknown) => typeof value === "string" ? value : "";
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const optionalText = (data: FormData, key: string) => text(data, key) || undefined;
const lines = (value: string) => value.split(/\r?\n|,/u).map((item) => item.trim()).filter(Boolean);
const rows = (value: string): string[][] => value ? JSON.parse(value) as string[][] : [];
const bool = (value: string | undefined) => value === "true";

function localized(en: string, fa: string) { return fa ? { en, fa } : { en }; }
function optionalLocalized(en: string, fa: string) { return { ...(en ? { en } : {}), ...(fa ? { fa } : {}) }; }

export function buildManifest(data: FormData, type: MarketplaceItemTypeKey, sourceKind: SourceKind, customLicense: boolean) {
  const source = sourceKind === "github_repository" ? {
    kind: sourceKind, repositoryUrl: text(data, "repositoryUrl"), commitSha: text(data, "commitSha"), ...(optionalText(data, "repositoryPath") ? { path: optionalText(data, "repositoryPath") } : {}),
  } : sourceKind === "github_release" ? {
    kind: sourceKind, repositoryUrl: text(data, "repositoryUrl"), tag: text(data, "releaseTag"), releaseCommitSha: text(data, "releaseCommitSha"), assetName: text(data, "assetName"), ...(optionalText(data, "assetDigest") ? { assetDigest: optionalText(data, "assetDigest") } : {}),
  } : { kind: sourceKind, packageName: text(data, "packageName"), version: text(data, "npmVersion"), integrity: text(data, "integrity") };
  const typeDetails = Object.fromEntries(detailFields[type].map((field) => {
    const key = `detail_${field.key}`;
    if (field.kind === "boolean") return [field.key, data.has(key)];
    if (field.kind === "list") return [field.key, lines(text(data, key))];
    if (field.kind === "stages") return [field.key, rows(text(data, key)).map(([name, description, humanApproval]) => ({ name, description, humanApproval: bool(humanApproval) }))];
    return [field.key, text(data, key)];
  }));
  return {
    manifestVersion: 1,
    type,
    listing: {
      slug: text(data, "slug"), name: { en: text(data, "nameEn") }, outcome: localized(text(data, "outcomeEn"), text(data, "outcomeFa")), description: optionalLocalized(text(data, "descriptionEn"), text(data, "descriptionFa")),
      categorySlug: text(data, "categorySlug"), communitySlugs: data.getAll("communitySlugs").map(String), tags: lines(text(data, "tags")),
      screenshots: rows(text(data, "screenshots")).map(([url, altEn, altFa]) => ({ url, alt: localized(altEn, altFa) })),
      ...(optionalText(data, "documentationUrl") ? { documentationUrl: optionalText(data, "documentationUrl") } : {}),
      ...(optionalText(data, "supportUrl") ? { supportUrl: optionalText(data, "supportUrl") } : {}),
      ...(optionalText(data, "issueTrackerUrl") ? { issueTrackerUrl: optionalText(data, "issueTrackerUrl") } : {}),
    },
    release: {
      version: text(data, "releaseVersion"), source, releaseNotes: text(data, "releaseNotes"),
      compatibility: rows(text(data, "compatibility")).map(([platform, models, notes]) => ({ platform, models: lines(models), ...(notes ? { notes } : {}) })),
      installation: { method: text(data, "installationMethod"), instructions: lines(text(data, "installationInstructions")) },
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
