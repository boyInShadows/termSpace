import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
export const buttonVariants = cva(
    // `focus-visible:outline-none` used to be the whole focus story here, which
  // cancelled the global focus ring and left every button — including the
  // icon-only ones — with no visible focus at all. The ring replaces it.
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-(--duration-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary:
          "bg-action text-action-foreground shadow-sm hover:bg-action-hover",
        secondary:
          "border border-border-strong bg-surface text-foreground shadow-sm hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        outline:
          "border border-foreground/60 text-foreground shadow-sm hover:bg-muted",
        destructive: "bg-destructive text-background hover:opacity-90",
      },
      size: {
        sm: "min-h-11 px-3 text-xs sm:min-h-9",
        md: "min-h-11 px-4 text-sm",
        lg: "min-h-12 px-5 text-base",
        icon: "size-11 p-0 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
interface ButtonProps
  extends
    // ComponentProps, not ButtonHTMLAttributes: React 19 passes `ref` as a prop.
    React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
