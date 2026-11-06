import Link from "next/link";
import { SafeImage } from "@/components/SafeImage";
import { ARTICLE_FALLBACK_IMAGE } from "@/lib/images";
import {getTranslations} from "next-intl/server";
import {getLocale} from "@/lib/serverLocale";
import {localePath} from "@/lib/i18n";

export async function Hero() {
  const [t, locale] = await Promise.all([getTranslations("Hero"), getLocale()]);
  return (
    <section className="relative overflow-hidden">
      <SafeImage
        src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1800&h=1000&fit=crop"
        fallback={ARTICLE_FALLBACK_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-paper/85" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#faf9f7_0%,rgba(250,249,247,0.92)_48%,rgba(250,249,247,0.34)_100%)]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">
          {t("eyebrow")}
        </p>
        <h1 className="mt-6 font-serif text-5xl md:text-6xl font-semibold leading-tight tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg text-ink-soft max-w-prose">
          {t("intro")}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={localePath("/blog", locale)}
            className="rounded-lg bg-accent px-6 py-3 font-medium text-paper transition-colors hover:bg-accent-soft"
          >
            {t("read")}
          </Link>
          <Link
            href={localePath("/topics", locale)}
            className="rounded-lg border border-line bg-paper-card px-6 py-3 font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            {t("explore")}
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
