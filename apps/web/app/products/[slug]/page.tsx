import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/features/product/product-actions";
import {
  CompatibilityBadges,
  CreatorIdentity,
  ProductTypeBadge,
  Rating,
} from "@/components/marketplace/product-parts";
import { ProductCard } from "@/components/marketplace/product-card";
import { ApiError, getProduct } from "@/lib/api";
import { getLocale } from "@/lib/serverLocale";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try { const product = await getProduct((await params).slug); return { title: product.name, description: product.outcome }; }
  catch { return { title: "Resource" }; }
}

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="border-t border-border py-9">
      <h2 className="editorial text-3xl font-semibold">{title}</h2>
      <div className="mt-5 text-[15px] leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const fa = locale === "fa";
  let product;
  try { product = await getProduct((await params).slug); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }
  const benefits = product.benefits;
  const included = product.includedFiles ?? [];
  const versions = product.versions;
  const reviews = product.reviews;
  return (
    <>
      <Header />
      <main className="container-page py-8">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
          Explore / {product.type} /{" "}
          <span className="text-foreground">{product.name}</span>
        </nav>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_21rem]">
          <div>
            <div className="flex flex-wrap gap-2">
              <ProductTypeBadge type={product.type} />
              {product.verified ? (
                <Badge variant="success">
                  <ShieldCheck size={12} />
                  {fa ? "منبع تأییدشده" : "Verified resource"}
                </Badge>
              ) : (
                <Badge variant="warning">{fa ? "هنوز بررسی نشده" : "Not yet reviewed"}</Badge>
              )}
            </div>
            <h1 className="editorial mt-5 max-w-3xl text-5xl font-medium leading-none sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-muted-foreground">
              {product.outcome}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <CreatorIdentity creator={product.creator} />
              <Rating rating={product.rating} count={product.reviewCount} />
              <span className="text-xs text-muted-foreground">
                {product.usageCount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} {fa ? "استفاده" : "uses"}
              </span>
            </div>
            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
              <Meta label="Version" value={product.version} icon={RefreshCw} />
              <Meta label="Updated" value={new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(product.updatedAt))} icon={Clock3} />
              <Meta label="Package" value={product.packageFileCount && product.packageSizeBytes ? `${product.packageFileCount} files · ${Math.round(product.packageSizeBytes / 1024)} KB` : "See package details"} icon={FileText} />
            </div>
            <Section title="What it does">
              <p>
                {product.description}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {benefits.map((x) => (
                  <p
                    key={x}
                    className="flex gap-3 rounded-md bg-surface p-4 text-sm text-foreground"
                  >
                    <Check className="mt-1 shrink-0 text-success" size={16} />
                    {x}
                  </p>
                ))}
              </div>
            </Section>
            {(product.useCases ?? []).length > 0 && (
            <Section title="Ideal use cases">
              <div className="grid gap-4 sm:grid-cols-3">
                {(product.useCases ?? []).map((useCase) => (
                  <div key={useCase.title} className="border-l-2 border-primary/40 pl-4">
                    <h3 className="font-semibold text-foreground">{useCase.title}</h3>
                    <p className="mt-1 text-sm">{useCase.description}</p>
                  </div>
                ))}
              </div>
            </Section>
            )}
            {included.length > 0 && (
            <Section title="Whatâ€™s included">
              <div className="overflow-hidden rounded-lg border bg-surface">
                {included.map((file) => (
                  <div
                    className="grid gap-1 border-b p-4 last:border-0 sm:grid-cols-[12rem_1fr]"
                    key={file.name}
                  >
                    <code className="font-mono text-xs text-foreground">
                      {file.name}
                    </code>
                    <span className="text-sm">{file.description}</span>
                  </div>
                ))}
              </div>
            </Section>
            )}
            {product.exampleInput && (
            <Section title="Example input and output">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="eyebrow">Input</p>
                  <pre className="mt-2 whitespace-pre-wrap rounded-lg border bg-surface p-4 font-mono text-xs leading-6">
                    {product.exampleInput}
                  </pre>
                </div>
                <div>
                  <p className="eyebrow">Output excerpt</p>
                  <div className="mt-2 rounded-lg bg-foreground p-5 text-background">
                    <p className="editorial text-2xl">
                      {product.exampleOutputTitle}
                    </p>
                    <p className="mt-2 text-sm text-background/70">
                      {product.exampleOutputBody}
                    </p>
                  </div>
                </div>
              </div>
            </Section>
            )}
            <Section title={fa ? "نصب و استفاده" : "Installation and usage"}>
              <div className="rounded-lg border bg-surface p-5">
                <p className="font-semibold text-foreground">{fa ? "راهنمای دقیق به نسخهٔ دریافت‌شده متصل است." : "Exact instructions are tied to the release you acquire."}</p>
                <p className="mt-2 text-sm">{fa ? "منبع را به کتابخانهٔ خود اضافه کنید تا پیوند تأییدشده، مرجع تغییرناپذیر و مراحل نصب همان نسخه نمایش داده شود." : "Add the resource to your library to reveal the verified provider URL, immutable reference, and installation steps for that exact version."}</p>
              </div>
            </Section>
            {versions.length > 0 && (
            <Section title="Version history">
              <div className="space-y-6">
                {versions.map((v, i) => (
                  <div
                    key={v.version}
                    className="grid gap-2 sm:grid-cols-[7rem_9rem_1fr]"
                  >
                    <code className="font-mono text-xs text-foreground">
                      v{v.version}
                      {i === 0 && " · latest"}
                    </code>
                    <span className="text-xs">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(v.releasedAt))}</span>
                    <p className="text-sm">{v.notes}</p>
                  </div>
                ))}
              </div>
            </Section>
            )}
            <Section title={`Reviews · ${product.rating}`} id="reviews">
              <div className="space-y-6">
                {reviews.map((r) => (
                  <article key={r.id} className="border-b pb-6">
                    <div className="flex justify-between gap-3">
                      <div>
                        <strong className="text-sm text-foreground">
                          {r.author}
                        </strong>
                        <p className="mt-1 text-xs">
                          <Rating rating={r.rating} /> · {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(r.createdAt))}
                        </p>
                      </div>
                      {r.verifiedPurchase && (
                        <Badge variant="success">{fa ? "استفادهٔ تأییدشده" : "Verified use"}</Badge>
                      )}
                    </div>
                    <p className="mt-3 max-w-2xl">{r.body}</p>
                  </article>
                ))}
              </div>
            </Section>
            <Section title="About the creator">
              <div className="rounded-lg border bg-surface p-6">
                <CreatorIdentity creator={product.creator} />
                <p className="mt-4 max-w-2xl">
                  {product.creator.bio} Every release includes examples, a
                  migration-aware changelog, and direct support for documented
                  issues.
                </p>
                <p className="mt-4 text-xs font-semibold text-foreground">
                  {product.creator.products} {fa ? "منبع" : "resources"} · {product.creator.followers.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} {fa ? "دنبال‌کننده" : "followers"}
                </p>
              </div>
            </Section>
          </div>
          <aside>
            <div className="sticky top-24 space-y-5 rounded-xl border border-border-strong bg-surface-raised p-5 shadow-soft">
              <div><p className="text-xs text-muted-foreground">{fa ? "اشتراک‌گذاری جامعه" : "Community sharing"}</p><p className="mt-1 text-2xl font-semibold">{fa ? "رایگان برای همه" : "Free for everyone"}</p></div>
              <ProductActions product={product} />
              <div className="border-t pt-5">
                <p className="eyebrow">Compatibility</p>
                <div className="mt-3">
                  <CompatibilityBadges
                    compatibility={product.compatibility}
                    limit={5}
                  />
                </div>
                {product.compatibility.models.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Models: {product.compatibility.models.join(", ")}
                  </p>
                )}
              </div>
              <TrustRow
                icon={Download}
                title="Requirements"
                text={product.requirements ?? "See documentation"}
              />
              <TrustRow
                icon={KeyRound}
                title="Permissions"
                text={product.permissions ?? "See permission disclosure"}
              />
              <TrustRow
                icon={ShieldCheck}
                title="Safety verification"
                text={product.verified ? "Package scan passed" : "Not yet reviewed by the team"}

                good={product.verified}
              />
              <TrustRow
                icon={FileText}
                title="License"
                text={product.license ?? "See license"}
              />
              <TrustRow
                icon={RefreshCw}
                title="Updates"
                text={product.updatesPolicy ?? "See update policy"}
              />
              <TrustRow
                icon={LockKeyhole}
                title="Refunds"
                text={product.refundPolicy ?? "See refund policy"}
              />
            </div>
          </aside>
        </div>
        <section className="mt-12 border-t pt-12">
          <p className="eyebrow">Keep building</p>
          <h2 className="editorial mt-2 text-4xl">Related products</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Meta({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof RefreshCw;
}) {
  return (
    <div className="bg-surface p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon size={14} />
        {label}
      </p>
      <p className="mt-1 font-mono text-xs font-semibold">{value}</p>
    </div>
  );
}
function TrustRow({
  icon: Icon,
  title,
  text,
  good,
}: {
  icon: typeof RefreshCw;
  title: string;
  text: string;
  good?: boolean;
}) {
  return (
    <div className="border-t pt-4">
      <p className="flex items-center gap-2 text-xs font-semibold">
        <Icon
          size={15}
          className={good ? "text-success" : "text-muted-foreground"}
        />
        {title}
        {good && <CheckCircle2 size={13} className="text-success" />}
      </p>
      <p className="mt-1 pl-6 text-xs leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

