"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { request } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Collection = { slug: string; titleEn: string; titleFa: string | null; descriptionEn: string; descriptionFa: string | null; scope: "STAFF" | "COMMUNITY"; community: { slug: string } | null; published: boolean; position: number; items: Array<{ productId: string }> };
type Options = { products: Array<{ id: string; name: string; slug: string }>; communities: Array<{ slug: string; nameEn: string; nameFa: string | null }> };

export function CuratedCollectionManager() {
  const { fa, locale } = useLocale();
  const admin = useMarketplaceSession().marketplaceRoles.includes("administrator");
  const [items, setItems] = useState<Collection[] | null>(null);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [options, setOptions] = useState<Options>({ products: [], communities: [] });
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void request<{ data: Collection[] }>("/api/marketplace/moderation/collections", { signal: controller.signal }).then(({ data }) => { setItems(data); setError(""); }).catch((cause) => { if (!controller.signal.aborted) setError((cause as Error).message); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void request<{ data: Options }>(`/api/marketplace/moderation/collections/options?q=${encodeURIComponent(query)}&ids=${encodeURIComponent(productIds.join(","))}`, { signal: controller.signal }).then(({ data }) => setOptions(data)).catch((cause) => { if (!controller.signal.aborted) setError((cause as Error).message); });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, productIds]);
  return <section className="space-y-5"><h1 className="editorial text-4xl">{fa ? "مجموعه‌های منتخب" : "Curated collections"}</h1><p className="text-sm text-muted-foreground">{fa ? "موارد مفید را برای خوانندگان و جامعه‌ها گردآوری کنید." : "Gather useful listings for readers and communities."}</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => { setSelected(null); setProductIds([]); }}>{fa ? "مجموعه جدید" : "New collection"}</Button>{items?.map((item) => <Button type="button" variant="secondary" key={item.slug} onClick={() => { setSelected(item); setProductIds(item.items.map((entry) => entry.productId)); }}>{fa ? item.titleFa ?? item.titleEn : item.titleEn}</Button>)}</div>
    {items && <form key={selected?.slug ?? "new"} className="space-y-4 rounded-xl border bg-surface p-5" onSubmit={async (event) => {
      event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); setBusy(true); setError("");
      try { await request(`/api/marketplace/moderation/collections/${encodeURIComponent(String(fields.get("slug")))}`, { method: "PUT", body: JSON.stringify({ titleEn: fields.get("titleEn"), titleFa: String(fields.get("titleFa") || "").trim() || null, descriptionEn: fields.get("descriptionEn"), descriptionFa: String(fields.get("descriptionFa") || "").trim() || null, scope: fields.get("scope"), communitySlug: fields.get("scope") === "STAFF" ? null : String(fields.get("communitySlug") || "") || null, published: fields.has("published"), position: Number(fields.get("position")), productIds }) }); setSelected(null); setProductIds([]); form.reset(); setRefresh((value) => value + 1); }
      catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
    }}>
      <label className="block text-sm">{fa ? "نشانی ثابت" : "Stable URL name"}<input name="slug" defaultValue={selected?.slug} readOnly={Boolean(selected)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} className="mt-2 block w-full rounded border bg-background p-2" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">English title<input name="titleEn" defaultValue={selected?.titleEn} required minLength={2} maxLength={100} className="mt-2 block w-full rounded border bg-background p-2" /></label><label className="block text-sm">عنوان فارسی<input name="titleFa" defaultValue={selected?.titleFa ?? ""} maxLength={100} dir="rtl" className="mt-2 block w-full rounded border bg-background p-2" /></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">English description<textarea name="descriptionEn" defaultValue={selected?.descriptionEn} required minLength={10} maxLength={1000} className="mt-2 block min-h-20 w-full rounded border bg-background p-2" /></label><label className="block text-sm">توضیح فارسی<textarea name="descriptionFa" defaultValue={selected?.descriptionFa ?? ""} maxLength={1000} dir="rtl" className="mt-2 block min-h-20 w-full rounded border bg-background p-2" /></label></div>
      <div className="grid gap-4 sm:grid-cols-3"><label className="block text-sm">{fa ? "نوع" : "Scope"}<select name="scope" defaultValue={selected?.scope ?? "COMMUNITY"} className="mt-2 block w-full rounded border bg-background p-2"><option value="COMMUNITY">{fa ? "جامعه" : "Community"}</option>{admin && <option value="STAFF">{fa ? "کارکنان" : "Staff"}</option>}</select></label><label className="block text-sm">{fa ? "جامعه" : "Community"}<select name="communitySlug" defaultValue={selected?.community?.slug ?? ""} className="mt-2 block w-full rounded border bg-background p-2"><option value="">{fa ? "بدون جامعه" : "None"}</option>{options.communities.map((community) => <option key={community.slug} value={community.slug}>{fa ? community.nameFa ?? community.nameEn : community.nameEn}</option>)}</select></label><label className="block text-sm">{fa ? "ترتیب" : "Position"}<input name="position" type="number" min={0} max={1000} defaultValue={selected?.position ?? 0} className="mt-2 block w-full rounded border bg-background p-2" /></label></div>
      <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={selected?.published} />{fa ? "انتشار عمومی" : "Publish publicly"}</label>
      <fieldset><legend className="font-semibold">{fa ? "موارد" : "Listings"}</legend><label className="mt-3 block text-sm">{fa ? "جست‌وجوی موارد" : "Search listings"}<input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 block w-full rounded border bg-background p-2" /></label><div className="mt-3 max-h-72 space-y-2 overflow-auto">{options.products.map((product) => <label key={product.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productIds.includes(product.id)} onChange={(event) => setProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />{product.name} <span className="text-muted-foreground">/{product.slug}</span></label>)}</div><p className="mt-2 text-xs text-muted-foreground">{productIds.length}/50 {fa ? "انتخاب‌شده" : "selected"}</p></fieldset>
      <div className="flex flex-wrap gap-3"><Button disabled={busy}>{fa ? "ذخیره مجموعه" : "Save collection"}</Button>{selected?.published && <Link className="text-sm text-primary underline" href={localePath(`/collections/${selected.slug}`, locale)}>{fa ? "نمایش مجموعه" : "View collection"}</Link>}</div>
    </form>}
  </section>;
}
