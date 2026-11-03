"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { useLocale } from "@/lib/locale-context";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { t } = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  // Hydration uses the server label before the saved preference is available.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const label = mounted && resolvedTheme === "light" ? t.homePage.toDarkTheme : t.homePage.toLightTheme;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={label}
      title={label}
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <Sun size={18} className="ts-theme-icon" data-theme-icon="sun" />
      <Moon size={18} className="ts-theme-icon" data-theme-icon="moon" />
    </Button>
  );
}
