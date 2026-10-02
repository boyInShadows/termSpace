import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return new Response("Not found", { status: 404 });
  const base = process.env.MARKETPLACE_PUBLIC_URL ?? (process.env.NODE_ENV === "production" ? null : "http://localhost:3000");
  if (!base) return new Response("Marketplace origin is not configured", { status: 503 });
  return NextResponse.redirect(new URL(`/products/${slug}`, base), 307);
}
