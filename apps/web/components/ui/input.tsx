import * as React from "react";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "min-h-11 w-full rounded-md border border-input bg-surface px-3 text-sm placeholder:text-muted-foreground hover:border-border-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:bg-muted disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
