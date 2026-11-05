import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { copy } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const theme = vi.hoisted(() => ({ resolvedTheme: undefined as string | undefined, setTheme: vi.fn() }));
vi.mock("next-themes", () => ({ useTheme: () => theme }));
vi.mock("@/lib/locale-context", () => ({ useLocale: () => ({ t: copy.en }) }));

it("hydrates a saved light theme with the correct destination label", async () => {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const container = document.createElement("div");
  container.innerHTML = renderToString(<ThemeToggle />);
  document.body.append(container);
  theme.resolvedTheme = "light";
  let root: Root | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, <ThemeToggle />); });
    expect(container.querySelector("button")).toHaveAttribute("aria-label", copy.en.homePage.toDarkTheme);
    expect(errors).not.toHaveBeenCalled();
  } finally {
    await act(async () => root?.unmount());
    container.remove();
    errors.mockRestore();
    theme.resolvedTheme = undefined;
  }
});
