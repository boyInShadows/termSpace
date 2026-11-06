import Link from "next/link";
import {notFound} from "next/navigation";
import {ApiClientError, api} from "@/lib/api";
import {SafeImage} from "@/components/SafeImage";
import {ARTICLE_FALLBACK_IMAGE} from "@/lib/images";
import {getLocale} from "@/lib/serverLocale";
import {copy, localePath} from "@/lib/i18n";
import {localizeEditionFa} from "@/lib/faContent";
import type {Metadata} from "next";
import {localizedAlternates, localizedUrl} from "@/lib/siteMetadata";

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  try {
    const [{slug}, locale] = await Promise.all([params, getLocale()]);
    const {data} = await api.getEdition(slug);
    const edition = locale === "fa" ? localizeEditionFa(data) : data;
    const path = `/editions/${data.slug}`;
    const title = locale === "fa" ? `شمارهٔ ${data.number}: ${edition.title}` : `Edition ${data.number}: ${edition.title}`;
    return {
      title,
      description: edition.description,
      alternates: localizedAlternates(path, locale),
      openGraph: {
        title,
        description: edition.description,
        type: "website",
        url: localizedUrl(path, locale),
        locale: locale === "fa" ? "fa_IR" : "en_US",
        images: data.coverImage ? [{url: data.coverImage, alt: edition.title}] : undefined,
      },
    };
  } catch {
    return {};
  }
}

export default async function EditionPage({params}: {params: Promise<{slug: string}>}) {
  const locale = await getLocale();
  const t = copy[locale];
  let edition;
  try {
    const data = (await api.getEdition((await params).slug)).data;
    edition = locale === "fa" ? localizeEditionFa(data) : data;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    throw error;
  }

  return (
    <section style={{"--edition-accent": edition.accentColor} as React.CSSProperties}>
      <header className="relative isolate min-h-[65vh] overflow-hidden bg-ink text-white">
        <SafeImage src={edition.coverImage} fallback={ARTICLE_FALLBACK_IMAGE} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-35 grayscale" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <div className="mx-auto flex min-h-[65vh] max-w-6xl flex-col justify-end px-6 py-16">
          <p className="font-mono text-xs uppercase tracking-[.35em] text-white/85">Termspace · {locale === "fa" ? "شماره" : "Edition"} {String(edition.number).padStart(2, "0")}</p>
          <h1 className="mt-5 max-w-5xl font-serif text-5xl font-medium leading-none tracking-tight md:text-8xl">{edition.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">{edition.description}</p>
        </div>
      </header>
      {edition.editorialNote && (
        <section className="mx-auto grid max-w-6xl gap-8 border-b border-line px-6 py-16 md:grid-cols-[1fr_2fr]">
          <p className="font-mono text-xs uppercase tracking-[.3em] text-accent">{t.fromEditor}</p>
          <p className="font-serif text-2xl leading-10 text-ink-soft md:text-3xl">{edition.editorialNote}</p>
        </section>
      )}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="space-y-0">
          {edition.articles.map((article, index) => (
            <Link key={article.id} href={localePath(`/blog/${article.slug}`, locale)} className="group grid gap-5 border-t border-line py-8 md:grid-cols-[6rem_1fr_auto] md:items-center">
              <span className="font-serif text-5xl text-ink-muted transition-colors group-hover:text-accent">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-xs uppercase tracking-widest text-accent">{article.category.name}</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold md:text-4xl">{article.title}</h2>
                {article.excerpt && <p className="mt-3 max-w-2xl leading-7 text-ink-soft">{article.excerpt}</p>}
              </div>
              <span aria-hidden="true" className="text-2xl transition-transform group-hover:translate-x-2 rtl:rotate-180 rtl:group-hover:-translate-x-2">→</span>
            </Link>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <Link href={localePath("/editions", locale)} className="rounded-full border border-line px-6 py-3 text-sm hover:border-[var(--edition-accent)]">{t.browseEditions}</Link>
        </div>
      </section>
    </section>
  );
}
