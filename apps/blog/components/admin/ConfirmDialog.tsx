"use client";

import { useEffect, useId, useRef, type KeyboardEvent } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [open]);

  function keepFocusInDialog(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) { event.preventDefault(); return; }
    // Native reverse Tab can leave the modal for browser chrome.
    if (event.shiftKey && event.target === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault(); first.focus();
    }
  }

  return (
      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onKeyDown={keepFocusInDialog}
        onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-paper-card p-6 text-ink shadow-xl backdrop:bg-ink/30"
      >
        <h2 id={`${id}-title`} className="font-serif text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-ink-soft">
          {description}
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-paper hover:bg-red-800 disabled:opacity-50"
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </dialog>
  );
}
