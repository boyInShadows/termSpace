import { prerender } from "react-dom/static";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/lib/locale-context";
import { copy } from "@/lib/i18n";
import { formatNumber } from "@/lib/format";
import { mockHome } from "@/lib/mock-home";
import Home from "./page";

const state = vi.hoisted(() => ({ locale: "en", home: vi.fn() }));
vi.mock("@/lib/api", () => ({ getMarketplaceHome: state.home }));
vi.mock("@/lib/serverLocale", () => ({ getLocale: async () => state.locale }));
vi.mock("@/components/layout/header", () => ({ Header: () => null }));
vi.mock("@/components/layout/footer", () => ({ Footer: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

async function renderHome(locale: "en" | "fa" = "en") {
  state.locale = locale;
  const { prelude } = await prerender(<LocaleProvider locale={locale}>{await Home()}</LocaleProvider>);
  return new DOMParser().parseFromString(await new Response(prelude).text(), "text/html");
}

describe("homepage catalogue states", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "0");
    state.home.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(["en", "fa"] as const)("keeps search and Retry without sample listings during an outage (%s)", async (locale) => {
    state.home.mockRejectedValue(new Error("Catalogue unavailable"));
    const document = await renderHome(locale);
    // Suspense content can stream outside its initial section in the response.
    expect(document.querySelectorAll("article")).toHaveLength(0);
    expect(document.querySelector('[role="status"] button')?.textContent).toContain(locale === "fa" ? "تلاش دوباره" : "Retry");
    expect(document.querySelector('input[aria-label]')).not.toBeNull();
    expect(document.querySelectorAll('a[href*="/products/"]')).toHaveLength(0);
    expect(document.body.textContent).not.toContain(locale === "fa" ? "هنوز منبع منتخبی نیست" : "Nothing featured yet");
    expect(document.body.textContent).not.toContain(copy[locale].viewAll.replace("{count}", formatNumber(mockHome.total, locale)));
  });

  it("renders real featured listings after a successful response", async () => {
    state.home.mockResolvedValue(mockHome);
    const document = await renderHome();
    expect(document.querySelectorAll("article")).toHaveLength(3);
    expect(document.querySelector('[role="status"] button')).toBeNull();
    expect(document.body.textContent).toContain(copy.en.viewAll.replace("{count}", formatNumber(mockHome.total, "en")));
    expect(console.error).not.toHaveBeenCalled();
  });

  it("distinguishes a healthy empty catalogue from an outage", async () => {
    state.home.mockResolvedValue({ ...mockHome, total: 0, products: [], types: [] });
    const document = await renderHome();
    expect(document.body.textContent).toContain("Nothing featured yet");
    expect(document.querySelector('[role="status"] button')).toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("retains the explicit mock preview without calling the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "1");
    const document = await renderHome();
    expect(document.querySelectorAll("article")).toHaveLength(3);
    expect(state.home).not.toHaveBeenCalled();
  });
});
