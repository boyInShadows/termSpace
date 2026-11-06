"use client";

import { useRef, useState } from "react";

export function useAdminAction() {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function run(action: () => Promise<void>, success: string) {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      await action();
      setFeedback({ kind: "success", text: success });
      return true;
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "The action failed. Try again." });
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { busy, feedback, run };
}
