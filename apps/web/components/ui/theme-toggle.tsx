"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { useLocale } from "@/lib/locale-context";

/**
 * Both icons are always in the DOM and the theme class decides which one is
 * visible, so there is nothing theme-dependent in the render output and no
 * hydration mismatch to suppress. `resolvedTheme` is read only inside the
 * click handler, where the client is already the source of truth.
 *
 * The pair cross-rotates rather than swapping: the sun winds out as the moon
 * winds in, which makes the switch feel like one mechanism instead of two
 * icons trading places.
 */
export function ThemeToggle() {
  const { t } = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  // Named by destination, not by "toggle": the label should say where the
  // button takes you. `resolvedTheme` is undefined until the client mounts,
  // and the dark default makes "switch to light" the right first answer.
  const label = resolvedTheme === "light" ? t.homePage.toDarkTheme : t.homePage.toLightTheme;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <span className="relative grid size-[18px] place-items-center">
        <Sun size={18} className="ts-theme-icon" data-theme-icon="sun" />
        <Moon size={18} className="ts-theme-icon" data-theme-icon="moon" />
      </span>
    </Button>
  );
}
