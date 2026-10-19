import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-none border px-2 py-1 text-[11px] font-semibold leading-none",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        primary: "border-border bg-transparent text-primary",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        info: "border-info/25 bg-info/10 text-info",
        outline: "bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export function Badge({
  className,
  variant,
  children,
}: React.PropsWithChildren<{
  className?: string;
  variant?: VariantProps<typeof badgeVariants>["variant"];
}>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
