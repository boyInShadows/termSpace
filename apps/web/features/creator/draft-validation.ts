import type { Locale } from "@/lib/i18n";

export type DraftControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type DraftIssue = { control: DraftControl; step: number; message: string; missing: boolean };
export type DraftStepState = { requiredComplete: boolean; issues: DraftIssue[] };

export const draftValidationCopy = {
  en: { required: "Enter this required value.", format: "Check the format of this value.", https: "Use an HTTPS URL without a username or password.", icon: "Use an image URL hosted on avatars.githubusercontent.com or raw.githubusercontent.com.", github: "Use a repository URL on github.com.", path: "Use a relative path without backslashes, . or .. segments.", description: "Add an English or Persian description.", selection: "Choose at least one platform.", duplicate: "Each entry must be unique.", attention: "Needs attention", current: "Current", errors: "Check the highlighted fields before continuing.", ready: "Ready to review", reviewIncomplete: "Complete the required fields in the earlier steps to see your review.", edit: "Edit", optional: "Optional", additional: "Additional settings", length: (min: number, max: number) => `Use ${min}–${max} characters.`, list: (count: number, length: number) => `Use at most ${count} entries, each up to ${length} characters.` },
  fa: { required: "این مقدار الزامی را وارد کنید.", format: "قالب این مقدار را بررسی کنید.", https: "نشانی HTTPS بدون نام کاربری یا رمز عبور وارد کنید.", icon: "از تصویر میزبانی‌شده در avatars.githubusercontent.com یا raw.githubusercontent.com استفاده کنید.", github: "نشانی مخزن در github.com وارد کنید.", path: "مسیر نسبی بدون بک‌اسلش و بخش‌های . یا .. وارد کنید.", description: "توضیح فارسی یا انگلیسی را وارد کنید.", selection: "حداقل یک سکو انتخاب کنید.", duplicate: "هر مورد باید یکتا باشد.", attention: "نیازمند بررسی", current: "مرحلهٔ فعلی", errors: "پیش از ادامه، فیلدهای مشخص‌شده را بررسی کنید.", ready: "آمادهٔ بازبینی", reviewIncomplete: "برای نمایش بازبینی، فیلدهای الزامی مراحل قبل را تکمیل کنید.", edit: "ویرایش", optional: "اختیاری", additional: "تنظیمات بیشتر", length: (min: number, max: number) => `بین ${min.toLocaleString("fa")} تا ${max.toLocaleString("fa")} نویسه وارد کنید.`, list: (count: number, length: number) => `حداکثر ${count.toLocaleString("fa")} مورد، هرکدام تا ${length.toLocaleString("fa")} نویسه وارد کنید.` },
};

const limits: Record<string, [number, number]> = {
  nameEn: [1, 160], slug: [1, 160], categorySlug: [1, 160], outcomeEn: [1, 500], outcomeFa: [1, 500], descriptionEn: [1, 10000], descriptionFa: [1, 10000],
  releaseVersion: [1, 64], releaseNotes: [3, 10000], releaseTag: [1, 100], assetName: [1, 255], originalAuthor: [1, 160], repositoryPath: [1, 500], packageName: [1, 214],
};
const detailLimits: Record<string, [number, number]> = {
  format: [1, 100], destinationScope: [1, 200], hostPlatform: [1, 100], installationIdentifier: [1, 300], connectedService: [2, 200], runtime: [1, 200], templateKind: [1, 100], outputFormat: [1, 200],
  activation: [3, 500], invocation: [3, 500], connectionMethod: [3, 500], distributionIdentity: [3, 500], authenticationMethod: [3, 500], authentication: [3, 500], callback: [3, 500], failurePolicy: [3, 500], initializationMethod: [3, 500], executionMethod: [3, 500], retryBehavior: [3, 500], rollbackBehavior: [3, 500], partialFailureBehavior: [3, 500],
  dataHandling: [3, 1000], dataFlow: [3, 1000], expectedEffect: [3, 1000], outputContract: [3, 1000], intermediateState: [3, 1000],
};
const listFields: Record<string, [number, number]> = {
  tags: [20, 160], installationInstructions: [30, 1000], runtimes: [30, 160], accounts: [30, 160], operatingSystems: [20, 160], dependencies: [100, 160],
};
const detailLists: Record<string, [number, number]> = { exposedTools: [200, 160], exposedResources: [200, 160], exposedPrompts: [200, 160], networkDestinations: [100, 253], requestedScopes: [100, 160], applicablePaths: [100, 500], entryPaths: [100, 500], intendedModels: [50, 100], events: [100, 100], includedPaths: [200, 500], variables: [100, 160], requiredInputs: [100, 160], replacementVariables: [100, 160], dependencies: [100, 160], initialInputs: [100, 160], finalOutputs: [100, 160] };
const splitList = (value: string) => value.split(/\r?\n|,/u).map(item => item.trim()).filter(Boolean);
const safePath = (value: string) => !value.startsWith("/") && !value.includes("\\") && value.split("/").every(part => part !== "." && part !== "..");

function fieldMessage(control: DraftControl, locale: Locale): string | null {
  const t = draftValidationCopy[locale], value = control.value.trim(), name = control.name;
  if (!value) return control.required ? t.required : null;
  if (control instanceof HTMLInputElement && control.type === "checkbox") return control.validity.customError ? t.selection : null;
  if (control.validity.typeMismatch || control.validity.patternMismatch || control.validity.badInput) return t.format;
  if (name === "installCommands") {
    const entries = value.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
    if (entries.length > 12) return t.list(12, 600);
    for (const entry of entries) {
      const parsed = /^([a-z]+)(?:\/([^:]{1,40}))?:\s+(.+)$/iu.exec(entry);
      if (parsed && !["any", "macos", "linux", "windows"].includes(parsed[1].toLowerCase())) return t.format;
      if ((parsed?.[3] ?? entry).length > 600) return t.length(1, 600);
    }
    return null;
  }
  const detail = name.startsWith("detail_") ? name.slice(7) : "";
  const rowPath = control.dataset.draftPath ?? "";
  const property = rowPath.split(".").at(-1);
  const rowBounds: [number, number] | undefined = property === "purpose" ? [3, rowPath.includes("environmentVariables") ? 300 : 500] : property === "description" ? [3, 500] : property === "name" ? [1, 100] : undefined;
  const bounds = (name === "license" ? [1, value.startsWith("https://") ? 2048 : 100] as [number, number] : undefined) ?? limits[name] ?? detailLimits[detail] ?? rowBounds ?? [Math.max(1, control instanceof HTMLSelectElement ? 1 : control.minLength), control instanceof HTMLInputElement && control.type === "url" ? 2048 : control instanceof HTMLSelectElement || control.maxLength < 0 ? 500 : control.maxLength];
  const hookPaths = detail === "entryPaths" && (control.form?.elements.namedItem("itemType") as HTMLSelectElement | null)?.value === "hook";
  const listBounds = listFields[name] ?? (property === "models" ? [30, 100] : property === "destinations" ? [50, 253] : hookPaths ? [50, 500] : control.hasAttribute("data-draft-list") ? detailLists[detail] ?? [50, 160] : undefined);
  if (listBounds) {
    const items = splitList(value);
    if (control.required && items.length === 0) return t.required;
    if (items.length > listBounds[0] || items.some(item => item.length > listBounds[1])) return t.list(...listBounds);
    if (control.dataset.draftAllowed && items.some(item => !control.dataset.draftAllowed!.split(",").includes(item))) return t.format;
    if ((name === "tags" && items.some(item => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item)))) return t.format;
    return null;
  }
  if (value.length < bounds[0] || value.length > bounds[1]) return t.length(...bounds);
  if (rowPath.includes("environmentVariables") && property === "name" && !/^[A-Z_][A-Z0-9_]*$/.test(value)) return t.format;
  if (control instanceof HTMLInputElement && control.type === "url" || name === "license" && value.startsWith("https://")) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || url.username || url.password || value.length > 2048) return t.https;
      if (name === "icon" && !["avatars.githubusercontent.com", "raw.githubusercontent.com"].includes(url.hostname)) return t.icon;
      if (name === "repositoryUrl" && url.hostname !== "github.com") return t.github;
    } catch { return t.https; }
  }
  if (["commitSha", "releaseCommitSha"].includes(name) && !/^[a-f0-9]{40}$/.test(value)) return t.format;
  if (name === "assetDigest" && !/^sha256:[a-f0-9]{64}$/.test(value)) return t.format;
  if (name === "assetName" && /[/\\]/.test(value)) return t.format;
  if (name === "repositoryPath" && !safePath(value)) return t.path;
  if (name === "packageName" && !/^(?:@[a-z0-9._~-]+\/)?[a-z0-9._~-]+$/.test(value)) return t.format;
  if (name === "npmVersion" && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value)) return t.format;
  if (name === "integrity" && !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(value)) return t.format;
  if (control.dataset.draftAllowed && !control.dataset.draftAllowed.split(",").includes(value)) return t.format;
  return control.validity.customError ? t.format : null;
}

/** Mounted step/disclosure fields share one evaluation; only rendered source/type branches participate. */
export function evaluateDraft(form: HTMLFormElement, locale: Locale): DraftStepState[] {
  const steps: DraftStepState[] = Array.from({ length: 3 }, () => ({ requiredComplete: true, issues: [] }));
  const controls = Array.from(form.querySelectorAll<DraftControl>("input, select, textarea"));
  function add(control: DraftControl, message: string, missing: boolean) {
    const step = Number(control.closest<HTMLElement>("[data-draft-step]")?.dataset.draftStep ?? 0);
    if (!steps[step]) return;
    steps[step].issues.push({ control, step, message, missing });
    if (missing || (control.required && !control.closest("[data-draft-optional-group]"))) steps[step].requiredComplete = false;
  }
  for (const control of controls) {
    if (control.disabled || !control.willValidate) continue;
    const message = fieldMessage(control, locale);
    if (message) add(control, message, (!control.value.trim() && control.required && !control.closest("[data-draft-optional-group]")) || control.dataset.draftRequiredGroup === "true" && control.validity.customError);
  }
  const descriptions = controls.filter(control => ["descriptionEn", "descriptionFa"].includes(control.name));
  if (descriptions.length && !descriptions.some(control => control.value.trim())) add(descriptions.find(control => control.name === (locale === "fa" ? "descriptionFa" : "descriptionEn"))!, draftValidationCopy[locale].description, true);
  for (const group of ["compatibility", "permissions", "environmentVariables"]) {
    const input = form.elements.namedItem(group);
    if (!(input instanceof HTMLInputElement)) continue;
    try {
      const rows = JSON.parse(input.value) as string[][];
      const keys = rows.map(row => row[0]);
      if (new Set(keys).size !== keys.length) {
        const control = input.closest("fieldset")?.querySelector<DraftControl>("input:not([type=hidden]), select, textarea");
        if (control) add(control, draftValidationCopy[locale].duplicate, false);
      }
    } catch { /* The mounted row components always serialize JSON; server validation remains authoritative. */ }
  }
  return steps;
}

const paths: Record<string, string> = {
  "listing.slug": "slug", "listing.name.en": "nameEn", "listing.outcome.en": "outcomeEn", "listing.outcome.fa": "outcomeFa", "listing.description.en": "descriptionEn", "listing.description.fa": "descriptionFa", "listing.description": "descriptionEn", "listing.categorySlug": "categorySlug", "listing.tags": "tags", "listing.icon": "icon", "listing.documentationUrl": "documentationUrl", "listing.supportUrl": "supportUrl", "listing.issueTrackerUrl": "issueTrackerUrl",
  "release.version": "releaseVersion", "release.releaseNotes": "releaseNotes", "release.source.url": "projectUrl", "release.source.repositoryUrl": "repositoryUrl", "release.source.commitSha": "commitSha", "release.source.releaseCommitSha": "releaseCommitSha", "release.source.tag": "releaseTag", "release.source.assetName": "assetName", "release.source.assetDigest": "assetDigest", "release.source.path": "repositoryPath", "release.source.packageName": "packageName", "release.source.version": "npmVersion", "release.source.integrity": "integrity", "release.source.originalAuthor": "originalAuthor", "release.installation.instructions": "installationInstructions", "release.installation.commands": "installCommands", "release.installation.method": "installationMethod", "release.license.identifier": "license", "release.license.customUrl": "license", "release.documentationUrl": "releaseDocumentationUrl", "release.supportUrl": "releaseSupportUrl",
};
export function draftRowPath(name: string, row: number, column: number) {
  const config: Record<string, [string, string[]]> = {
    screenshots: ["listing.screenshots", ["url", "alt.en", "alt.fa"]],
    compatibility: ["release.compatibility", ["platform", "models", "notes"]],
    permissions: ["release.permissions", ["capability", "required", "scope", "destinations", "purpose"]],
    environmentVariables: ["release.requirements.environmentVariables", ["name", "purpose", "required", "sensitive"]],
    detail_stages: ["typeDetails.stages", ["name", "description", "humanApproval"]],
  };
  const entry = config[name];
  return entry ? `${entry[0]}.${row}.${entry[1][column]}` : undefined;
}
export function serverDraftIssues(form: HTMLFormElement, details: { path: string; message: string }[]): DraftIssue[] {
  return details.flatMap(issue => {
    const path = issue.path.replace(/^manifest\./, "");
    const direct = Array.from(form.querySelectorAll<DraftControl>("[data-draft-path]")).find(control => path === control.dataset.draftPath || path.startsWith(`${control.dataset.draftPath}.`));
    const name = paths[path] ?? Object.entries(paths).find(([key]) => path.startsWith(`${key}.`))?.[1] ?? (path.startsWith("typeDetails.") ? `detail_${path.split(".")[1]}` : path.startsWith("release.requirements.") ? path.split(".")[2] : path.startsWith("release.") ? path.split(".")[1] : path.startsWith("listing.") ? path.split(".")[1] : undefined);
    const field = direct ?? (name ? form.elements.namedItem(name) : null);
    const control = field instanceof HTMLInputElement && field.type === "hidden" ? field.closest("fieldset")?.querySelector<DraftControl>("input:not([type=hidden]), select, textarea") : field;
    return control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement ? [{ control, step: Number(control.closest<HTMLElement>("[data-draft-step]")?.dataset.draftStep ?? 0), message: issue.message, missing: false }] : [];
  });
}
