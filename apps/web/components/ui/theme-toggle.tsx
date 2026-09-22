"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

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
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <span className="relative grid size-[18px] place-items-center">
        <Sun size={18} className="ts-theme-icon" data-theme-icon="sun" />
        <Moon size={18} className="ts-theme-icon" data-theme-icon="moon" />
      </span>
    </Button>
  );
}
