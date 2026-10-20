"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProductCard } from "@/components/marketplace/product-card";
import {
  CompatibilityBadges,
  CreatorIdentity,
  ProductTypeBadge,
  Rating,
  TrustStatus,
} from "@/components/marketplace/product-parts";
import { EmptyState } from "@/components/patterns/empty-state";
import { products, creators } from "@/lib/fixtures";
export function Showroom() {
  const [toast, setToast] = useState(false);
  return (
    <>
      <div className="space-y-16">
        <Show
          title="Actions"
          note="Purposeful hierarchy with tactile, restrained feedback."
        >
          <div className="flex flex-wrap gap-3">
            <Button>Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outlined</Button>
            <Button variant="ghost">Quiet action</Button>
            <Button variant="destructive">Delete</Button>
            <Button disabled>Disabled</Button>
            <Button>
              <LoaderCircle className="animate-spin" />
              Loading
            </Button>
          </div>
        </Show>
        <Show
          title="Fields & selection"
          note="44px minimum targets, explicit labels, and consistent focus treatment."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Workspace name
              <Input className="mt-2" defaultValue="Editorial research" />
            </label>
            <label className="text-sm font-semibold">
              Product URL
              <Input
                className="mt-2 border-destructive"
                defaultValue="not a url"
                aria-invalid
              />
              <span className="mt-1 block text-xs text-destructive">
                Enter a valid product URL.
              </span>
            </label>
            <label className="text-sm font-semibold">
              Search
              <div className="relative mt-2">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={17}
                />
                <Input className="pl-10" placeholder="Search building blocks" />
              </div>
            </label>
            <label className="text-sm font-semibold">
              Product type
              <select className="mt-2 min-h-11 w-full rounded-md border bg-surface px-3 text-sm">
                <option>Skill</option>
                <option>Agent</option>
                <option>MCP server</option>
              </select>
            </label>
          </div>
          <div className="mt-7 flex flex-wrap gap-8">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="size-5 accent-primary" />
              Include updates
            </label>
            <div role="radiogroup" className="flex gap-4">
              {["One-time", "Free"].map((x, i) => (
                <label className="flex items-center gap-2 text-sm" key={x}>
                  <input type="radio" name="pricing" value={i ? "free" : "one"} defaultChecked={!i} className="size-5 accent-primary" />
                  {x}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm">
              Verified only
              <Switch.Root className="h-6 w-11 rounded-full bg-border-strong p-0.5 data-[state=checked]:bg-primary">
                <Switch.Thumb className="block size-5 rounded-full bg-background transition-transform data-[state=checked]:translate-x-5" />
              </Switch.Root>
            </label>
          </div>
        </Show>
        <Show title="Navigation & overlays">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Product health"
              title="Product health score"
            >
              <Zap size={17} />
            </Button>
            <details className="relative">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border bg-secondary px-4 text-sm font-semibold">
                Actions <ChevronDown size={15} />
              </summary>
              <ul className="absolute z-50 mt-1 min-w-40 rounded-md border bg-surface p-1">
                <li><button className="w-full rounded-none px-3 py-2 text-start text-sm hover:bg-muted focus:bg-muted">Edit listing</button></li>
                <li><button className="w-full rounded-none px-3 py-2 text-start text-sm hover:bg-muted focus:bg-muted">View analytics</button></li>
                <li className="my-1 h-px bg-border" role="separator" />
                <li><button className="w-full rounded-none px-3 py-2 text-start text-sm text-destructive hover:bg-muted focus:bg-muted">Unpublish</button></li>
              </ul>
            </details>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button variant="secondary">Open dialog</Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6">
                  <Dialog.Title className="editorial text-2xl">
                    Publish this product?
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                    Your listing will become visible in community search. You
                    can unpublish it at any time.
                  </Dialog.Description>
                  <div className="mt-6 flex justify-end gap-2">
                    <Dialog.Close asChild>
                      <Button variant="ghost">Cancel</Button>
                    </Dialog.Close>
                    <Dialog.Close asChild>
                      <Button>Publish</Button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <Button
              variant="secondary"
              onClick={() => {
                setToast(true);
                setTimeout(() => setToast(false), 2500);
              }}
            >
              Show toast
            </Button>
          </div>
          {toast && (
            <div
              role="status"
              className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border bg-surface-raised p-4"
            >
              <Check className="text-success" size={18} />
              <div>
                <p className="text-sm font-semibold">Changes saved</p>
                <p className="text-xs text-muted-foreground">
                  Your local prototype was updated.
                </p>
              </div>
            </div>
          )}
        </Show>
        <Show title="Badges, identity & trust">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="primary">Featured</Badge>
            <Badge variant="success">Approved</Badge>
            <Badge variant="warning">Needs review</Badge>
            <Badge variant="info">MCP server</Badge>
            <ProductTypeBadge type="Skill" />
            <TrustStatus />
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-8">
            <div className="flex -space-x-2">
              {creators.slice(0, 4).map((c) => (
                <Avatar key={c.id} initials={c.initials} />
              ))}
            </div>
            <CreatorIdentity creator={creators[0]} />
            <Rating rating={4.9} count={184} />
            <CompatibilityBadges compatibility={products[1].compatibility} />
          </div>
        </Show>
        <Show title="System feedback">
          <div className="grid gap-3 md:grid-cols-3">
            <Alert
              tone="info"
              icon={Info}
              title="Information"
              copy="GPT-5 support was added in v2.4."
            />
            <Alert
              tone="warning"
              icon={AlertTriangle}
              title="Review needed"
              copy="Permission disclosure changed."
            />
            <Alert
              tone="success"
              icon={ShieldCheck}
              title="Scan passed"
              copy="No unsafe files or network calls found."
            />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border bg-surface p-4"
              >
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="mt-5 h-6 w-3/4 rounded bg-muted" />
                <div className="mt-3 h-3 w-full rounded bg-muted" />
                <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        </Show>
        <Show
          title="Community resource cards"
          note="Compact, expanded, featured, verified, and unverified content states."
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Show>
        <Show title="Empty & error states">
          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState />
            <div className="border border-destructive/30 bg-surface px-6 py-12 text-center">
              <AlertTriangle className="mx-auto text-destructive" />
              <h3 className="editorial mt-4 text-2xl">
                Something did not load
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your filters are safe. Try loading the results again.
              </p>
              <Button variant="secondary" className="mt-5">
                Try again
              </Button>
            </div>
          </div>
        </Show>
        <Show title="Pagination">
          <nav aria-label="Pagination" className="flex justify-center gap-1">
            {["Previous", "1", "2", "3", "…", "12", "Next"].map((x, i) => (
              <button
                key={`${x}-${i}`}
                disabled={i === 0}
                className={`min-h-10 min-w-10 rounded-md px-3 text-sm ${x === "1" ? "bg-primary text-primary-foreground" : "hover:bg-muted"} disabled:opacity-40`}
              >
                {x}
              </button>
            ))}
          </nav>
        </Show>
      </div>
    </>
  );
}
function Show({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border-strong pt-7">
      <div className="mb-7 grid gap-2 md:grid-cols-[15rem_1fr]">
        <h2 className="editorial text-3xl">{title}</h2>
        {note && (
          <p className="max-w-lg text-sm text-muted-foreground">{note}</p>
        )}
      </div>
      {children}
    </section>
  );
}
function Alert({
  tone,
  icon: Icon,
  title,
  copy,
}: {
  tone: "info" | "warning" | "success";
  icon: typeof Info;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-surface p-4">
      <Icon
        className={
          tone === "success"
            ? "text-success"
            : tone === "warning"
              ? "text-warning"
              : "text-info"
        }
        size={19}
      />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}
