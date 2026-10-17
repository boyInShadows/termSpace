import { CopyBlock } from "@/components/patterns/copy-block";
import { intlLocale } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { fetchCommand, mcpConfig, sourcePageUrl } from "@/lib/install";
import type { ProductRelease } from "@/lib/types";

const text = {
  en: {
    title: "Source & provenance",
    sources: { npm: "npm package", github_repository: "GitHub repository", github_release: "GitHub release" } as Record<string, string>,
    source: "Source", pinned: "Pinned to", digest: "Integrity digest", noDigest: "The source did not provide one",
    checked: "Last source check", never: "Not yet checked", version: "Release", license: "Licence", notStated: "Not stated",
    verified: "Verified", stale: "Check overdue",
    staleNote: "The last source check is overdue. The pinned release may have changed or been removed upstream.",
    permissions: "Declared permissions", none: "No permissions declared", required: "Required", optional: "Optional",
    environment: "Environment variables", secret: "secret",
    caps: {
      filesystem_read: "Read files", filesystem_write: "Write files", process_execution: "Run processes", network_access: "Network access",
      environment_access: "Read environment variables", secret_access: "Access secrets", browser_automation: "Automate a browser",
      external_account_access: "Use external accounts", persistent_storage: "Store data persistently", background_execution: "Run in the background",
      code_modification: "Modify code", telemetry: "Send telemetry",
    } as Record<string, string>,
    note: "This shows where the release comes from and what its author declares. It is not a guarantee of safety: review the source before you run it.",
    fetch: "Fetch the exact release", fetchHint: "Fetches the pinned artifact only. Follow the creator's steps in your library to install it into your tool.",
    mcp: "MCP client config", mcpHint: "Generated from the pinned npm release. Check the creator's instructions for extra arguments, and fill in the placeholders.",
    copy: "Copy", copied: "Copied", failed: "Couldn't copy automatically. The text is selected: press Ctrl+C.",
  },
  fa: {
    title: "منبع و اصالت",
    sources: { npm: "بستهٔ npm", github_repository: "مخزن گیت‌هاب", github_release: "انتشار گیت‌هاب" } as Record<string, string>,
    source: "منبع", pinned: "قفل‌شده روی", digest: "چکیدهٔ یکپارچگی", noDigest: "منبع چکیده‌ای ارائه نکرده است",
    checked: "آخرین بررسی منبع", never: "هنوز بررسی نشده", version: "نسخه", license: "مجوز", notStated: "ذکر نشده",
    verified: "تأییدشده", stale: "بررسی عقب‌افتاده",
    staleNote: "بررسی منبع عقب افتاده است. ممکن است نسخهٔ قفل‌شده در مبدأ تغییر کرده یا حذف شده باشد.",
    permissions: "مجوزهای اعلام‌شده", none: "مجوزی اعلام نشده", required: "الزامی", optional: "اختیاری",
    environment: "متغیرهای محیطی", secret: "محرمانه",
    caps: {
      filesystem_read: "خواندن فایل‌ها", filesystem_write: "نوشتن فایل‌ها", process_execution: "اجرای فرایندها", network_access: "دسترسی به شبکه",
      environment_access: "خواندن متغیرهای محیطی", secret_access: "دسترسی به رمزها", browser_automation: "خودکارسازی مرورگر",
      external_account_access: "استفاده از حساب‌های بیرونی", persistent_storage: "ذخیرهٔ پایدار داده", background_execution: "اجرا در پس‌زمینه",
      code_modification: "تغییر کد", telemetry: "ارسال داده‌های تله‌متری",
    } as Record<string, string>,
    note: "این بخش نشان می‌دهد نسخه از کجا آمده و سازنده چه چیزی اعلام کرده است. این تضمین ایمنی نیست؛ پیش از اجرا منبع را بررسی کنید.",
    fetch: "دریافت نسخهٔ دقیق", fetchHint: "فقط همان فایل قفل‌شده را دریافت می‌کند. برای نصب در ابزار خود، مراحل سازنده را در کتابخانه‌تان دنبال کنید.",
    mcp: "پیکربندی کلاینت MCP", mcpHint: "از نسخهٔ قفل‌شدهٔ npm ساخته شده است. دستور سازنده را برای آرگومان‌های اضافه بررسی و مقادیر نمونه را پر کنید.",
    copy: "کپی", copied: "کپی شد", failed: "کپی خودکار انجام نشد. متن انتخاب شده است؛ Ctrl+C را بزنید.",
  },
};

export const provenanceTitle = (locale: Locale) => text[locale].title;
export const capabilityLabel = (locale: Locale, capability: string) => text[locale].caps[capability] ?? capability;

function Fact({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={mono ? "mt-1 break-all font-mono text-xs text-foreground" : "mt-1 text-sm font-medium text-foreground"} dir={mono ? "ltr" : undefined}>{children}</dd>
    </div>
  );
}

export function ReleaseProvenance({ release, slug, locale }: { release: ProductRelease; slug: string; locale: Locale }) {
  const t = text[locale];
  const { source } = release;
  const page = sourcePageUrl(release);
  const command = fetchCommand(release);
  const config = mcpConfig(release, slug);
  const date = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" });
  const copyProps = { copyLabel: t.copy, copiedLabel: t.copied, failedLabel: t.failed };

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 rounded-xl border bg-surface p-4 sm:grid-cols-2">
        <Fact label={t.source}>
          {t.sources[source.kind] ?? source.kind}
          {page && <> · <a href={page} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-xs text-primary hover:underline" dir="ltr">{page.replace("https://", "")}</a></>}
        </Fact>
        <Fact label={t.version}>v{release.version}</Fact>
        <Fact label={t.pinned} mono>{source.ref}</Fact>
        <Fact label={t.digest} mono={Boolean(source.integrityDigest)}>{source.integrityDigest ?? t.noDigest}</Fact>
        <Fact label={t.checked}>
          {source.checkedAt ? date.format(new Date(source.checkedAt)) : t.never} · {source.status === "stale" ? t.stale : t.verified}
        </Fact>
        <Fact label={t.license}>{release.license ?? t.notStated}</Fact>
      </dl>
      {source.status === "stale" && <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300">{t.staleNote}</p>}

      <div>
        <h3 className="font-semibold text-foreground">{t.permissions}</h3>
        {release.permissions.length === 0 ? <p className="mt-2 text-sm">{t.none}</p> : (
          <ul className="mt-3 space-y-3">
            {release.permissions.map((permission) => (
              <li key={permission.capability} className="rounded-lg bg-surface p-3 text-sm">
                <p className="font-medium text-foreground">
                  {t.caps[permission.capability] ?? permission.capability} · <span className="text-muted-foreground">{permission.required ? t.required : t.optional}</span>
                </p>
                <p className="ts-bidi mt-1">{permission.purpose}</p>
                {(permission.scope || permission.destinations.length > 0) && (
                  <p className="mt-1 break-all font-mono text-xs" dir="ltr">{[permission.scope, ...permission.destinations].filter(Boolean).join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {release.environment.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground">{t.environment}</h3>
          <ul className="mt-3 space-y-2">
            {release.environment.map((variable) => (
              <li key={variable.name} className="text-sm">
                <span className="font-mono text-xs text-foreground" dir="ltr">{variable.name}</span>
                {variable.sensitive && <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs">{t.secret}</span>}
                <span className="ts-bidi"> — {variable.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm">{t.note}</p>

      {command && (
        <div className="space-y-2">
          <CopyBlock label={t.fetch} text={command} {...copyProps} />
          <p className="text-xs">{t.fetchHint}</p>
        </div>
      )}
      {config && (
        <div className="space-y-2">
          <CopyBlock label={t.mcp} text={config} {...copyProps} />
          <p className="text-xs">{t.mcpHint}</p>
        </div>
      )}
    </div>
  );
}
