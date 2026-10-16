"use client";
import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "copied" | "failed";

/** Resolves false instead of throwing when the clipboard is denied or missing. */
export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * A command or config the reader pastes elsewhere. Clipboard access can be
 * denied or missing (insecure origin, embedded browsers), so a failure selects
 * the text and says so rather than silently doing nothing.
 */
export function CopyBlock({ label, text, copyLabel, copiedLabel, failedLabel }: {
  label: string; text: string; copyLabel: string; copiedLabel: string; failedLabel: string;
}) {
  const code = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  async function copy() {
    if (await copyToClipboard(text)) {
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
      return;
    }
    if (code.current) {
      const range = document.createRange();
      range.selectNodeContents(code.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    setStatus("failed");
  }

  return (
    <div>
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex items-start gap-3 rounded-lg border bg-surface p-3">
        <pre dir="ltr" className="min-w-0 flex-1 overflow-x-auto text-start font-mono text-xs leading-6 text-foreground"><code ref={code}>{text}</code></pre>
        <Button type="button" size="sm" variant="secondary" onClick={() => void copy()}>
          {status === "copied" ? <Check size={15} /> : <Copy size={15} />}
          {status === "copied" ? copiedLabel : copyLabel}
        </Button>
      </div>
      <p role="status" className="mt-1 min-h-4 text-xs text-muted-foreground">{status === "failed" ? failedLabel : ""}</p>
    </div>
  );
}
