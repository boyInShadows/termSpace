import { buttonVariants } from "@/components/ui/button";
import { localePath, type Locale } from "@/lib/i18n";
import { StatusHeading } from "./status-heading";

/**
 * Server-rendered 404 content with recovery links and a GET search form.
 * The root not-found boundary participates in every route, so keep its content
 * free of client-only search/product chunks. Global navigation lives in the
 * root layout; these recovery controls also work without JavaScript.
 */
export function NotFoundView({ locale, eyebrow, title, body }: { locale: Locale; eyebrow: string; title: string; body: string }) {
  const fa = locale === "fa";
  const links = [
    { href: "/explore", label: fa ? "کاوش در فهرست" : "Explore the catalogue", primary: true },
    { href: "/dashboard", label: fa ? "انتشار کار شما" : "Publish your work" },
    { href: "/", label: fa ? "خانه" : "Home" },
  ];
  const searchLabel = fa ? "جست‌وجو در منابع جامعه بر اساس نتیجه" : "Search community resources by outcome";
  return (
    <main id="content" tabIndex={-1} className="container-page flex min-h-[80vh] flex-col py-10">
      <a href={localePath("/", locale)} className="editorial self-start text-2xl font-semibold" dir="ltr">
        termspace<span className="ms-0.5 text-primary">|</span>
      </a>
      <div className="my-auto py-12">
        <StatusHeading eyebrow={eyebrow} title={title}>
          {body}
        </StatusHeading>
        <form action={localePath("/explore", locale)} role="search" className="mt-8 max-w-xl">
          <div className="relative flex items-center rounded-xl border border-border-strong bg-surface/90 focus-within:border-primary">
            <svg aria-hidden viewBox="0 0 24 24" className="ms-5 size-[18px] shrink-0 fill-none stroke-current stroke-2 text-muted-foreground" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              name="q"
              aria-label={searchLabel}
              placeholder={fa ? "از هوش مصنوعی چه می‌خواهید؟" : "What do you want AI to do better?"}
              className="h-14 min-w-0 flex-1 bg-transparent px-4 text-base placeholder:text-muted-foreground focus:outline-none"
            />
            <button type="submit" className="me-2 h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              {fa ? "جست‌وجو" : "Search"}
            </button>
          </div>
        </form>
        <nav aria-label={fa ? "ادامه" : "Where next"} className="mt-8 flex flex-wrap gap-3">
          {links.map((link) => (
            <a key={link.href} href={localePath(link.href, locale)} className={buttonVariants({ variant: link.primary ? "primary" : "secondary" })}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </main>
  );
}
