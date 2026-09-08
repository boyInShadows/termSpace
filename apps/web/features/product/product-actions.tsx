"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Eye,
  Heart,
  ShoppingBag,
  X,
  FileText,
  Folder,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductDetail } from "@/lib/types";
import { acquireProduct, ApiError } from "@/lib/api";
import { useMarketplaceSession } from "@/features/account/marketplace-session";
export function ProductActions({ product }: { product: ProductDetail }) {
  const session = useMarketplaceSession();
  const router = useRouter();
  const saved = session.isFavorite(product.slug);
  const [message, setMessage] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const acquisitionKey = useRef<string | null>(null);
  async function acquire() {
    if (!session.email) { router.push(`/account?next=${encodeURIComponent(window.location.pathname)}`); return; }
    setBuying(true); setMessage(null);
    acquisitionKey.current ??= crypto.randomUUID();
    try { await acquireProduct(product.slug, acquisitionKey.current); setMessage("Added to your account."); acquisitionKey.current = null; }
    catch (cause) { setMessage(cause instanceof ApiError ? cause.message : "Acquisition failed. No charge was made."); console.error("Product acquisition failed", cause); }
    finally { setBuying(false); }
  }
  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" disabled={buying} onClick={() => void acquire()}>
        <ShoppingBag size={18} />
        {buying ? "Processing…" : product.pricing.model === "free" ? "Add for free" : `Buy for ${new Intl.NumberFormat("en-US", { style: "currency", currency: product.pricing.currency }).format(product.pricing.amountMinor / 100)}`}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="secondary">
              <Eye size={17} />
              Preview
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <Dialog.Title className="editorial text-3xl">
                    Inside {product.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    A read-only preview of the package structure and one
                    example.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close preview"
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
                  <p className="eyebrow">Excerpt · SKILL.md</p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border bg-surface p-4 font-mono text-xs leading-6 text-muted-foreground">{product.previewExcerpt ?? "No preview is available for this product."}</pre>
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => void navigator.clipboard.writeText(product.previewExcerpt ?? "")} disabled={!product.previewExcerpt}>
                    <Copy size={14} />
                    Copy excerpt
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
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {product.pricing.model === "free" ? "Free acquisition" : "One-time purchase"} · {product.license ?? "License details above"}
      </p>
      {message && <p role="status" className="text-center text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
