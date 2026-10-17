"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Copy, FileText, Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/components/patterns/copy-block";
import { useLocale } from "@/lib/locale-context";
import type { ProductDetail } from "@/lib/types";

/** Loaded only when someone opens the preview, so it stays out of the page's first-load JS. */
export function PreviewDialogContent({ product }: { product: ProductDetail }) {
  const { fa } = useLocale();
  const [status, setStatus] = useState<"copied" | "failed" | null>(null);
  const copy = fa ? {
    inside: "محتوای", description: "پیش‌نمایش فقط‌خواندنی ساختار بسته و یک نمونه.", close: "بستن پیش‌نمایش",
    excerpt: "بخشی از محتوا", unavailable: "برای این منبع پیش‌نمایشی وجود ندارد.", copyExcerpt: "کپی بخش نمونه",
    copied: "گزیده کپی شد.", failed: "کپی خودکار انجام نشد. متن را انتخاب کنید و Ctrl+C را بزنید.",
  } : {
    inside: "Inside", description: "A read-only preview of the package structure and one example.", close: "Close preview",
    excerpt: "Excerpt", unavailable: "No preview is available for this resource.", copyExcerpt: "Copy excerpt",
    copied: "Excerpt copied.", failed: "Couldn’t copy automatically. Select the text and press Ctrl+C.",
  };
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 shadow-lift">
        <div className="flex items-start justify-between">
          <div>
            <Dialog.Title className="editorial text-3xl">{copy.inside} {product.name}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">{copy.description}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" aria-label={copy.close}><X /></Button>
          </Dialog.Close>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-[13rem_1fr]">
          <div className="rounded-lg bg-muted p-4 font-mono text-xs">
            <p className="flex gap-2 font-semibold"><Folder size={14} />{product.slug}/</p>
            {product.previewFiles.map((file) => (
              <p className="mt-3 flex gap-2 ps-4" key={file}><FileText size={13} />{file}</p>
            ))}
          </div>
          <div>
            <p className="eyebrow">{copy.excerpt}</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg border bg-surface p-4 font-mono text-xs leading-6 text-muted-foreground">{product.previewExcerpt ?? copy.unavailable}</pre>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => void copyToClipboard(product.previewExcerpt ?? "").then((ok) => setStatus(ok ? "copied" : "failed"))}
              disabled={!product.previewExcerpt}
            >
              <Copy size={14} />
              {copy.copyExcerpt}
            </Button>
            <p role="status" className="mt-1 min-h-4 text-xs text-muted-foreground">{status === "copied" ? copy.copied : status === "failed" ? copy.failed : ""}</p>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
