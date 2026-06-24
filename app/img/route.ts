import type { NextRequest } from "next/server";

/**
 * Same-origin image proxy for emoji art.
 *
 * Why: copying an image to the clipboard requires fetching its bytes, which is
 * blocked cross-origin without CORS. Routing through here makes every emoji
 * same-origin, adds an immutable cache (so Vercel's CDN serves repeats), and
 * keeps the browser from hotlinking third-party hosts directly.
 *
 * Security: only an allowlisted set of hosts may be proxied (no open proxy).
 */
const ALLOWED_HOSTS = new Set<string>([
  "emojis.slackmojis.com",
  "slackmojis.com",
]);

function r2Host(): string | null {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).host;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("u");
  if (!target) return new Response("missing url", { status: 400 });

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new Response("bad url", { status: 400 });
  }

  const allowed = new Set(ALLOWED_HOSTS);
  const rh = r2Host();
  if (rh) allowed.add(rh);
  if (url.protocol !== "https:" || !allowed.has(url.host)) {
    return new Response("host not allowed", { status: 403 });
  }

  const upstream = await fetch(url.toString(), {
    headers: { "User-Agent": "Blitzmoji/1.0" },
    cache: "force-cache",
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("upstream error", { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
