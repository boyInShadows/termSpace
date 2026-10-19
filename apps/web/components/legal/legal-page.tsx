import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { pageAlternates } from "@/lib/alternates";
import { getLocale } from "@/lib/serverLocale";
import { legalContact, legalDocs, legalEntity, legalLabels, LEGAL_UPDATED, type LegalSlug } from "@/lib/legal";

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const locale = await getLocale();
  const doc = legalDocs[locale][slug];
  return { title: doc.title, description: doc.intro, alternates: pageAlternates(`/${slug}`, locale) };
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const locale = await getLocale();
  const doc = legalDocs[locale][slug];
  const labels = legalLabels[locale];
  const contact = legalContact();
  return <>
    <Header />
    <main id="content" className="container-page py-12 sm:py-16">
      <article className="max-w-3xl">
        <p className="eyebrow">{legalEntity()}</p>
        <h1 className="editorial mt-3 text-4xl sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">{labels.updated}: <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time></p>
        <p className="mt-6 leading-7 text-muted-foreground">{doc.intro}</p>
        {doc.sections.map((section) => <section key={section.heading} className="mt-10">
          <h2 className="editorial text-2xl">{section.heading}</h2>
          {section.body?.map((text) => <p key={text} className="mt-3 leading-7">{text}</p>)}
          {section.list && <ul className="mt-3 list-disc space-y-2 ps-6 leading-7">{section.list.map((item) => <li key={item}>{item}</li>)}</ul>}
        </section>)}
        {contact && <p className="mt-10 border-t pt-6">{labels.contact}: <a className="font-semibold text-primary underline-offset-4 hover:underline" href={`mailto:${contact}`}>{contact}</a></p>}
      </article>
    </main>
    <Footer />
  </>;
}
