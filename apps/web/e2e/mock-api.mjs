// A stand-in for apps/api, so e2e and Lighthouse runs never depend on the
// real API or its database. The homepage catalogue comes from the web app's
// own fixture (NEXT_PUBLIC_USE_MOCK=1); this server answers what the browser
// asks for through /backend: the reader session and the creator dashboard.
//
// The public catalogue (list, detail, home, types) comes from
// mock-catalog.mjs and needs no session.
//
// Personas are chosen by a cookie, set at sign-in from the email address:
//   creator@e2e.test -> creator workspace with three listings
//   empty@e2e.test   -> creator workspace with no listings
// No cookie means signed out.
import { createServer } from "node:http";
import { mockHome } from "../lib/mock-home.ts";
import { ITEM_TYPES, PLATFORMS, listProducts, productDetail } from "./mock-catalog.mjs";

const PORT = Number(process.env.MOCK_API_PORT ?? 4099);
const COOKIE = "e2e_persona";
const DAY = 86_400_000;

const ago = (ms) => new Date(Date.now() - ms).toISOString();

const PERSONAS = {
  creator: { email: "creator@e2e.test", listings: 3 },
  empty: { email: "empty@e2e.test", listings: 0 },
};

function profile(persona) {
  return {
    id: `creator-${persona}`,
    name: persona === "creator" ? "Ellis North" : "Empty Studio",
    handle: persona === "creator" ? "ellisnorth" : "emptystudio",
    initials: persona === "creator" ? "EN" : "ES",
    verified: true,
    bio: "Fixture creator for end-to-end tests.",
    products: PERSONAS[persona].listings,
    followers: 0,
    createdAt: ago(90 * DAY),
    updatedAt: ago(DAY),
    accessActive: true,
  };
}

const LISTING_STATES = ["published", "submitted", "changes_requested"];

function listing(index) {
  const state = LISTING_STATES[index];
  const updatedAt = ago((index + 1) * DAY);
  return {
    id: `listing-${index + 1}`,
    slug: `fixture-listing-${index + 1}`,
    name: ["PR Reviewer", "Schema Linter", "Release Notes Writer"][index],
    type: "Skill",
    typeKey: "skill",
    state,
    lifecycleVersion: 1,
    published: state === "published",
    rating: state === "published" ? 4.6 : 0,
    reviewCount: state === "published" ? 12 : 0,
    acquisitionCount: state === "published" ? 48 : 0,
    currentVersion: "1.2.0",
    releaseCount: 3,
    latestRelease: { version: "1.2.0", releasedAt: updatedAt },
    moderationFeedback: state === "changes_requested"
      ? { action: "changes_requested", reasonCode: "UNCLEAR_PERMISSIONS", message: "State what the skill reads.", createdAt: updatedAt }
      : null,
    recentUpdates: [{ id: `event-${index + 1}`, action: state === "published" ? "published" : state, state, message: null, createdAt: updatedAt }],
    updatedAt,
  };
}

function dashboard(persona) {
  const listings = Array.from({ length: PERSONAS[persona].listings }, (_, index) => listing(index));
  const published = listings.filter((item) => item.published);
  return {
    data: {
      summary: {
        totalListings: listings.length,
        publishedListings: published.length,
        inReviewListings: listings.filter((item) => item.state === "submitted").length,
        totalAcquisitions: published.reduce((sum, item) => sum + item.acquisitionCount, 0),
        acquisitionsLast7Days: published.length ? 9 : 0,
        acquisitionsPrevious7Days: published.length ? 6 : 0,
        averageRating: published.length ? 4.6 : null,
        ratedReviewCount: published.reduce((sum, item) => sum + item.reviewCount, 0),
      },
      listings,
    },
    meta: { page: 1, limit: 8, total: listings.length, totalPages: 1 },
  };
}

function personaOf(request) {
  const match = /(?:^|;\s*)e2e_persona=(\w+)/.exec(request.headers.cookie ?? "");
  return match && match[1] in PERSONAS ? match[1] : null;
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json", ...headers });
  response.end(body === undefined ? undefined : JSON.stringify(body));
}

const error = (code, message) => ({ error: { code, message } });

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  try { return JSON.parse(raw || "{}"); } catch { return {}; }
}

async function handle(request, response) {
  const { pathname, searchParams } = new URL(request.url ?? "/", "http://mock");
  const persona = personaOf(request);
  const route = `${request.method} ${pathname}`;

  if (route === "GET /health") return send(response, 200, { ok: true });

  if (route === "GET /api/marketplace/home") return send(response, 200, { data: { ...mockHome, platforms: PLATFORMS } });
  if (route === "GET /api/marketplace/item-types") return send(response, 200, { data: ITEM_TYPES });
  if (route === "GET /api/marketplace/communities") return send(response, 200, { data: [] });
  if (route === "GET /api/marketplace/products") return send(response, 200, listProducts(searchParams));
  const detail = /^GET \/api\/marketplace\/products\/([^/]+)$/.exec(route);
  if (detail) {
    const product = productDetail(decodeURIComponent(detail[1]));
    return product ? send(response, 200, { data: product }) : send(response, 404, error("NOT_FOUND", "No such listing"));
  }

  if (route === "POST /api/readers/login") {
    const { email = "" } = await readJson(request);
    const chosen = String(email).startsWith("empty") ? "empty" : "creator";
    return send(response, 200, { data: { authenticated: true } }, {
      "Set-Cookie": `${COOKIE}=${chosen}; Path=/; HttpOnly; SameSite=Lax`,
    });
  }
  if (route === "POST /api/readers/logout") {
    return send(response, 204, undefined, { "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0` });
  }

  if (!persona) return send(response, 401, error("UNAUTHENTICATED", "Sign in to continue"));

  if (route === "GET /api/readers/session") {
    return send(response, 200, {
      data: {
        authenticated: true,
        user: { id: `reader-${persona}`, email: PERSONAS[persona].email, emailVerified: true, marketplaceRoles: ["creator"] },
      },
    });
  }
  if (route === "GET /api/marketplace/favorites") return send(response, 200, { data: [] });
  if (route === "GET /api/marketplace/library") {
    return send(response, 200, { data: [], meta: { page: 1, limit: 24, total: 0, totalPages: 0 } });
  }
  if (route === "GET /api/marketplace/creator/profile") return send(response, 200, { data: profile(persona) });
  if (route === "GET /api/marketplace/creator/dashboard") return send(response, 200, dashboard(persona));

  // Loud, so a test that starts depending on a new endpoint says which one.
  console.error(`[mock-api] unhandled ${route}`);
  return send(response, 404, error("NOT_FOUND", `The e2e mock API does not serve ${route}`));
}

createServer((request, response) => {
  handle(request, response).catch((cause) => {
    console.error("[mock-api] handler failed", cause);
    send(response, 500, error("MOCK_FAILURE", "The e2e mock API failed"));
  });
}).listen(PORT, "127.0.0.1", () => console.log(`[mock-api] listening on http://127.0.0.1:${PORT}`));
