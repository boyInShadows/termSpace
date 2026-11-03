import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useAdminAction } from "@/components/admin/use-admin-action";

it("does not repeat a pending write and reports success", async () => {
  const { result } = renderHook(useAdminAction);
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const write = vi.fn(() => pending);
  await act(async () => {
    const first = result.current.run(write, "Saved");
    expect(await result.current.run(write, "Saved")).toBe(false);
    finish();
    expect(await first).toBe(true);
  });
  expect(write).toHaveBeenCalledOnce();
  expect(result.current.feedback).toEqual({ kind: "success", text: "Saved" });
  expect(result.current.busy).toBe(false);
});

it("surfaces a failed write and permits a subsequent retry", async () => {
  const { result } = renderHook(useAdminAction);
  await act(async () => { await result.current.run(async () => { throw new Error("Upload unavailable"); }, "Saved"); });
  expect(result.current.feedback).toEqual({ kind: "error", text: "Upload unavailable" });
  await act(async () => { expect(await result.current.run(async () => {}, "Saved")).toBe(true); });
  expect(result.current.feedback?.kind).toBe("success");
});
