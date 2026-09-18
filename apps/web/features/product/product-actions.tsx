"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Eye,
  Heart,
  LibraryBig,
  X,
  FileText,
  Folder,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductDetail } from "@/lib/types";
import { acquireProduct } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
import { useLocale } from "@/lib/locale-context";
export function ProductActions({ product }: { product: ProductDetail }) {
  const { fa } = useLocale();
  const copy = fa ? {
    added: "به کتابخانهٔ شما افزوده شد.", failed: "افزودن منبع انجام نشد. دوباره تلاش کنید.", adding: "در حال افزودن…", add: "افزودن به کتابخانه",
    preview: "پیش‌نمایش", inside: "محتوای", previewDescription: "پیش‌نمایش فقط‌خواندنی ساختار بسته و یک نمونه.", close: "بستن پیش‌نمایش",
    excerpt: "بخشی از SKILL.md", unavailable: "برای این منبع پیش‌نمایشی وجود ندارد.", copyExcerpt: "کپی بخش نمونه", saved: "ذخیره‌شده", save: "ذخیره",
    free: "منبع رایگان جامعه", license: "جزئیات مجوز در بالا",
  } : {
    added: "Added to your library.", failed: "Could not add this resource. Please try again.", adding: "Adding…", add: "Add to library",
    preview: "Preview", inside: "Inside", previewDescription: "A read-only preview of the package structure and one example.", close: "Close preview",
    excerpt: "Excerpt · SKILL.md", unavailable: "No preview is available for this resource.", copyExcerpt: "Copy excerpt", saved: "Saved", save: "Save",
    free: "Free community resource", license: "License details above",
  };
  const session = useMarketplaceSession();
  const router = useRouter();
  const saved = session.isFavorite(product.slug);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const acquisitionKey = useRef<string | null>(null);
  async function acquire() {
    if (!session.email) { router.push(`/account?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setAdding(true); setMessage(null);
    acquisitionKey.current ??= crypto.randomUUID();
    try { await acquireProduct(product.slug, acquisitionKey.current); setMessage(copy.added); acquisitionKey.current = null; }
    catch (cause) { setMessage(copy.failed); console.error("Resource library add failed", cause); }
    finally { setAdding(false); }
  }
  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" disabled={adding} onClick={() => void acquire()}>
        <LibraryBig size={18} />
        {adding ? copy.adding : copy.add}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Eye size={17} />
              {copy.preview}
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <Dialog.Title className="editorial text-3xl">
                    {copy.inside} {product.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    {copy.previewDescription}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={copy.close}
                  >
                    <X />
                  </Button>
                </Dialog.Close>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-[13rem_1fr]">
                <div className="rounded-lg bg-muted p-4 font-mono text-xs">
                  <p className="flex gap-2 font-semibold">
                    <Folder size={14} />
                    {product.slug}/
                  </p>
                  {product.previewFiles.map((f) => (
                    <p className="mt-3 flex gap-2 pl-4" key={f}>
                      <FileText size={13} />
                      {f}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="eyebrow">{copy.excerpt}</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border bg-surface p-4 font-mono text-xs leading-6 text-muted-foreground">{product.previewExcerpt ?? copy.unavailable}</pre>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => void navigator.clipboard.writeText(product.previewExcerpt ?? "")} disabled={!product.previewExcerpt}>
                    <Copy size={14} />
                    {copy.copyExcerpt}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Button
          variant="secondary"
          aria-pressed={saved}
          onClick={() => void session.toggleFavorite(product.slug)}
        >
          <Heart
            size={17}
            className={saved ? "fill-primary text-primary" : ""}
          />
          {saved ? copy.saved : copy.save}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {copy.free} · {product.license ?? copy.license}
      </p>
      {message && <p role="status" className="text-center text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
