"use client";
import { useEffect, useState } from "react";
import { request, getCreatorDashboard, getDiscoveryOptions } from "@/lib/api";
import type { Community, CreatorDashboardListing } from "@/lib/types";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";

type Placement = {
  id: string;
  state: string;
  version: number;
  publicReason: string | null;
  community: Community;
  product: { name: string };
};
type Collection = {
  slug: string;
  title: string;
  description: string;
  published: boolean;
  items: Array<{ productId: string }>;
};
export function PlacementManager({ staff = false }: { staff?: boolean }) {
  const { fa, t } = useLocale();
  const [items, setItems] = useState<Placement[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    request<{ data: Placement[]; meta: { totalPages: number } }>(
      `/api/marketplace/${staff ? "moderation" : "creator"}/placements?page=${page}`,
      { signal: controller.signal },
    )
      .then((result) => {
        setItems(result.data);
        setPages(result.meta.totalPages);
        setError("");
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [staff, page, refresh]);
  return (
    <section>
      <h1 className="editorial text-4xl">
        {fa ? "درخواست‌های جامعه" : "Community placements"}
      </h1>
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          {error}{" "}
          <Button onClick={() => setRefresh((value) => value + 1)}>
            {t.discovery.retry}
          </Button>
        </p>
      )}
      {!items && !error && <p role="status">{t.wait}</p>}
      {items?.length === 0 && (
        <p className="mt-6">
          {fa ? "درخواستی وجود ندارد." : "No placement requests yet."}
        </p>
      )}
      {items?.map((item) => (
        <article className="mt-6 rounded-xl border p-5" key={item.id}>
          <h2 className="text-xl font-semibold">
            {item.product.name} ·{" "}
            {fa
              ? (item.community.nameFa ?? item.community.nameEn)
              : item.community.nameEn}
          </h2>
          <p className="mt-2">{item.state}</p>
          <p>{item.publicReason}</p>
          {staff && (
            <form
              className="mt-4 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                setBusy(true);
                try {
                  await request(
                    `/api/marketplace/moderation/placements/${item.id}`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        expectedVersion: item.version,
                        state: fields.get("state"),
                        publicReason: fields.get("reason"),
                        internalNote: fields.get("note") || undefined,
                      }),
                    },
                  );
                  setRefresh((value) => value + 1);
                } catch (cause) {
                  setError((cause as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="block">
                {fa ? "تصمیم" : "Decision"}
                <select
                  name="state"
                  className="ml-3 rounded border bg-surface p-2"
                >
                  <option>APPROVED</option>
                  <option>REJECTED</option>
                  <option>REMOVED</option>
                </select>
              </label>
              <label className="block">
                {fa
                  ? "دلیل عمومی و ارتباط با جامعه"
                  : "Public reason and ecosystem relevance"}
                <textarea
                  name="reason"
                  required
                  minLength={10}
                  maxLength={1000}
                  className="mt-2 w-full rounded border bg-surface p-2"
                />
              </label>
              <label className="block">
                {fa ? "یادداشت خصوصی" : "Private note"}
                <textarea
                  name="note"
                  maxLength={4000}
                  className="mt-2 w-full rounded border bg-surface p-2"
                />
              </label>
              <Button disabled={busy}>
                {fa ? "ثبت تصمیم" : "Record decision"}
              </Button>
            </form>
          )}
        </article>
      ))}
      <div className="mt-6 flex gap-3">
        <Button disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>
          {fa ? "قبلی" : "Previous"}
        </Button>
        <span>
          {page} / {Math.max(1, pages)}
        </span>
        <Button
          disabled={page >= pages || busy}
          onClick={() => setPage(page + 1)}
        >
          {fa ? "بعدی" : "Next"}
        </Button>
      </div>
    </section>
  );
}

export function CollectionManager() {
  const { fa, t } = useLocale();
  const [items, setItems] = useState<Collection[] | null>(null);
  const [listings, setListings] = useState<CreatorDashboardListing[]>([]);
  const [selected, setSelected] = useState<Collection | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      request<{ data: Collection[] }>("/api/marketplace/creator/collections", {
        signal: controller.signal,
      }),
      (async () => {
        const first = await getCreatorDashboard(1, 50, controller.signal);
        for (let page = 2; page <= first.meta.totalPages; page++) {
          const next = await getCreatorDashboard(page, 50, controller.signal);
          first.data.listings.push(...next.data.listings);
        }
        return first;
      })(),
    ])
      .then(([collections, dashboard]) => {
        setItems(collections.data);
        setListings(dashboard.data.listings);
        setError("");
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [refresh]);
  return (
    <section>
      <h1 className="editorial text-4xl">
        {fa ? "مجموعه‌های من" : "My collections"}
      </h1>
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          {error}
        </p>
      )}
      {!items && !error && <p role="status">{t.wait}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setSelected(null)}>
          {fa ? "مجموعه جدید" : "New collection"}
        </Button>
        {items?.map((item) => (
          <Button
            variant="secondary"
            key={item.slug}
            onClick={() => setSelected(item)}
          >
            {item.title}
          </Button>
        ))}
      </div>
      {items && (
        <form
          key={selected?.slug ?? "new"}
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const fields = new FormData(form);
            setBusy(true);
            try {
              await request(
                `/api/marketplace/creator/collections/${encodeURIComponent(String(fields.get("slug")))}`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    title: fields.get("title"),
                    description: fields.get("description"),
                    published: fields.has("published"),
                    productIds: fields.getAll("product"),
                  }),
                },
              );
              setSelected(null);
              form.reset();
              setRefresh((value) => value + 1);
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            {fa ? "نشانی ثابت" : "Stable URL name"}
            <input
              name="slug"
              defaultValue={selected?.slug}
              readOnly={Boolean(selected)}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
              className="mt-2 w-full rounded border bg-surface p-2"
            />
          </label>
          <label className="block">
            {fa ? "عنوان" : "Title"}
            <input
              name="title"
              defaultValue={selected?.title}
              required
              minLength={2}
              maxLength={100}
              className="mt-2 w-full rounded border bg-surface p-2"
            />
          </label>
          <label className="block">
            {fa ? "توضیح" : "Description"}
            <textarea
              name="description"
              defaultValue={selected?.description}
              maxLength={1000}
              className="mt-2 w-full rounded border bg-surface p-2"
            />
          </label>
          <label className="flex gap-2">
            <input
              name="published"
              type="checkbox"
              defaultChecked={selected?.published}
            />
            {fa ? "نمایش عمومی مجموعه" : "Publish collection"}
          </label>
          <fieldset>
            <legend>
              {fa
                ? "موارد مجموعه؛ فقط موارد منتشرشده نمایش داده می‌شوند"
                : "Listings; only published items appear publicly"}
            </legend>
            {listings.map((listing) => (
              <label key={listing.id} className="mt-2 flex gap-2">
                <input
                  name="product"
                  value={listing.id}
                  type="checkbox"
                  defaultChecked={selected?.items.some(
                    (item) => item.productId === listing.id,
                  )}
                />
                {listing.name} · {listing.state}
              </label>
            ))}
          </fieldset>
          <Button disabled={busy}>
            {fa ? "ذخیره مجموعه" : "Save collection"}
          </Button>
        </form>
      )}
    </section>
  );
}

export function CommunityManager() {
  const { fa, t } = useLocale();
  const [items, setItems] = useState<Community[] | null>(null);
  const [platforms, setPlatforms] = useState<
    Array<{ key: string; name: string }>
  >([]);
  const [selected, setSelected] = useState<Community | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      request<{ data: Community[] }>(
        "/api/marketplace/moderation/communities",
        { signal: controller.signal },
      ),
      getDiscoveryOptions(),
    ])
      .then(([result, options]) => {
        if (!controller.signal.aborted) {
          setItems(result.data);
          setPlatforms(options.platforms);
          setError("");
        }
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [refresh]);
  const labels: Record<string, string> = {
    nameEn: "English name",
    nameFa: "نام فارسی",
    descriptionEn: "English description",
    descriptionFa: "توضیح فارسی",
    rulesEn: "English rules",
    rulesFa: "قوانین فارسی",
    submissionGuidanceEn: "English submission guidance",
    submissionGuidanceFa: "راهنمای ارسال فارسی",
  };
  return (
    <section>
      <h1 className="editorial text-4xl">
        {fa ? "مدیریت جامعه‌ها" : "Manage communities"}
      </h1>
      {error && (
        <p role="alert" className="mt-4 text-destructive">
          {error}
        </p>
      )}
      {!items && !error && <p role="status">{t.wait}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setSelected(null)}>
          {fa ? "جامعه جدید" : "New community"}
        </Button>
        {items?.map((item) => (
          <Button
            key={item.slug}
            variant="secondary"
            onClick={() => setSelected(item)}
          >
            {item.nameEn}
          </Button>
        ))}
      </div>
      {items && (
        <form
          key={selected?.slug ?? "new"}
          className="mt-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const body = Object.fromEntries(
              Object.entries(labels).map(([name]) => [
                name,
                fields.get(name) || null,
              ]),
            );
            setBusy(true);
            try {
              await request(
                `/api/marketplace/moderation/communities/${encodeURIComponent(String(fields.get("slug")))}`,
                {
                  method: "PUT",
                  body: JSON.stringify({
                    ...body,
                    primaryPlatform: fields.get("platform"),
                    state: fields.get("state"),
                    accentColor: fields.get("color"),
                  }),
                },
              );
              setRefresh((value) => value + 1);
            } catch (cause) {
              setError((cause as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            {fa ? "نشانی ثابت" : "Stable URL name"}
            <input
              name="slug"
              defaultValue={selected?.slug}
              readOnly={Boolean(selected)}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
              className="mt-2 w-full rounded border bg-surface p-2"
            />
          </label>
          {Object.entries(labels).map(([name, label]) => (
            <label className="block" key={name}>
              {label}
              <textarea
                name={name}
                defaultValue={selected?.[name as keyof Community] ?? ""}
                required={name.endsWith("En")}
                minLength={name.startsWith("name") ? 2 : 10}
                maxLength={name.startsWith("name") ? 100 : 1000}
                className="mt-2 w-full rounded border bg-surface p-2"
              />
            </label>
          ))}
          <label className="block">
            {fa ? "پلتفرم اصلی" : "Primary platform"}
            <select
              name="platform"
              defaultValue={selected?.primaryPlatform}
              className="ml-3 rounded border bg-surface p-2"
            >
              {platforms.map((platform) => (
                <option key={platform.key} value={platform.key}>
                  {platform.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            {fa ? "وضعیت" : "State"}
            <select
              name="state"
              defaultValue={selected?.state}
              className="ml-3 rounded border bg-surface p-2"
            >
              <option>ACTIVE</option>
              <option>ARCHIVED</option>
            </select>
          </label>
          <label className="block">
            {fa ? "رنگ" : "Accent color"}
            <input
              name="color"
              type="color"
              defaultValue={selected?.accentColor ?? "#0f766e"}
              className="ml-3"
            />
          </label>
          <Button disabled={busy}>
            {fa ? "ذخیره جامعه" : "Save community"}
          </Button>
        </form>
      )}
    </section>
  );
}
