import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { ProductRelease } from "@/lib/types";
import { capabilityLabel } from "./release-provenance";

const text = {
  en: {
    permissions: "Permissions", licence: "Licence", release: "Release", pinned: "Pinned to", digest: "Digest",
    notDeclared: "Not declared", notStated: "Not stated", noDigest: "Not provided by the source",
    verified: "source verified", stale: "source check overdue",
  },
  fa: {
    permissions: "دسترسی‌ها", licence: "مجوز", release: "نسخه", pinned: "متصل به", digest: "چکیدهٔ یکپارچگی",
    notDeclared: "اعلام نشده", notStated: "ذکر نشده", noDigest: "منبع آن را ارائه نکرده",
    verified: "منبع تأییدشده", stale: "بررسی منبع عقب افتاده",
  },
};

/** One labelled row of a title block or spec table. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-4 border-t border-border py-3 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground"><bdi>{children}</bdi></dd>
    </div>
  );
}

/** What a listing leaves undeclared is printed, never hidden. */
export function Absent({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-destructive">{children}</span>;
}

/**
 * The facts that change from one release to the next. The current release
 * passes the listing's own one-line summaries; any other release is described
 * from the structured declarations it was published with.
 */
export function ReleaseFacts({ release, locale, summary }: { release: ProductRelease; locale: Locale; summary?: { permissions: string | null; license: string | null } }) {
  const t = text[locale];
  const permissions = summary ? summary.permissions : release.permissions.map((item) => capabilityLabel(locale, item.capability)).join(" · ") || null;
  const license = summary ? summary.license : release.license;
  const { source } = release;
  return (
    <>
      <Fact label={t.permissions}>{permissions ?? <Absent>{t.notDeclared}</Absent>}</Fact>
      <Fact label={t.licence}>{license ?? t.notStated}</Fact>
      <Fact label={t.release}>
        <span className="font-mono" dir="ltr">v{release.version}</span>
        <span className="text-muted-foreground"> · {source.status === "stale" ? t.stale : t.verified}</span>
      </Fact>
      <Fact label={t.pinned}><span className="break-all font-mono text-xs" dir="ltr">{source.ref}</span></Fact>
      <Fact label={t.digest}>
        {source.integrityDigest ? <span className="break-all font-mono text-xs" dir="ltr">{source.integrityDigest}</span> : <Absent>{t.noDigest}</Absent>}
      </Fact>
    </>
  );
}
