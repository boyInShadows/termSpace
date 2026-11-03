import Link from "next/link";
import type {Edition} from "@/lib/types";
import {SafeImage} from "./SafeImage";
import {ARTICLE_FALLBACK_IMAGE} from "@/lib/images";
import {copy, localePath, type Locale} from "@/lib/i18n";

export function EditionCover({edition, locale = "en"}: {edition: Edition; locale?: Locale}) {
  const lead = edition.articles[0];
  const t = copy[locale];
  return (
    <section className="edition-cover relative isolate min-h-[78vh] overflow-hidden bg-ink text-white" style={{"--edition-accent": edition.accentColor} as React.CSSProperties}>
      <SafeImage src={edition.coverImage ?? lead?.heroImage} fallback={ARTICLE_FALLBACK_IMAGE} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-45 saturate-50" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,12,12,.96)_0%,rgba(12,12,12,.82)_48%,rgba(12,12,12,.2)_100%)]" />
      <div className="absolute inset-y-0 start-[8%] w-px bg-white/20" />
      <div className="absolute inset-x-0 top-24 h-px bg-[var(--edition-accent)]" />
      <div className="mx-auto grid min-h-[78vh] max-w-6xl grid-cols-[auto_1fr] gap-6 px-6 py-24 md:gap-14">
        <div className="edition-reveal flex flex-col items-center border-e border-white/20 pe-5 md:pe-8">
          <span className="font-mono text-xs uppercase tracking-[.35em] text-white/75">{locale === "fa" ? "شماره" : "Edition"}</span>
          <span className="mt-4 font-serif text-5xl leading-none text-white md:text-7xl">{String(edition.number).padStart(2, "0")}</span>
          <span className="mt-auto hidden origin-bottom-left -rotate-90 whitespace-nowrap font-mono text-xs uppercase tracking-[.3em] text-white/75 md:block">Termspace · {new Date(edition.publishedAt ?? edition.createdAt).getFullYear()}</span>
        </div>
        <div className="flex max-w-4xl flex-col justify-center py-10">
          <p className="edition-reveal text-xs font-medium uppercase tracking-[.35em] text-white">{t.currentEdition}</p>
          <h1 className="edition-reveal mt-6 max-w-4xl font-serif text-5xl font-medium leading-[.95] tracking-[-.04em] sm:text-6xl md:text-8xl">{edition.title}</h1>
          <p className="edition-reveal mt-8 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">{edition.description}</p>
          <div className="edition-reveal mt-10 flex flex-wrap items-center gap-5">
            <Link href={localePath(`/editions/${edition.slug}`, locale)} className="rounded-full bg-accent hover:bg-accent-soft px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">{t.openEdition}</Link>
            {lead && <Link href={localePath(`/blog/${lead.slug}`, locale)} className="border-b border-white/50 pb-1 text-sm text-white/85 hover:border-white">{t.beginWith} «{lead.title}»</Link>}
          </div>
          <p className="edition-reveal mt-14 font-mono text-xs uppercase tracking-[.25em] text-white/75">{edition.articles.length} {t.consideredPieces}</p>
        </div>
      </div>
    </section>
  );
}
