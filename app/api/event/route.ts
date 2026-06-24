import { incrementStat } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Anonymous interaction ping. No-ops silently when the DB is unconfigured. */
export async function POST(req: Request) {
  let body: { id?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const { id, kind } = body;
  if (typeof id !== "string" || (kind !== "copy" && kind !== "download")) {
    return new Response("bad request", { status: 400 });
  }
  await incrementStat(id, kind);
  // Always 204 — tracking is best-effort and must never surface to the user.
  return new Response(null, { status: 204 });
}
