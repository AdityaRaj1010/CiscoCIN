import { NextResponse } from "next/server";

/**
 * GET /api/config/slido
 *
 * Hands the client the Slido event id from SLIDO_EVENT_ID so
 * components/slido-embed.tsx can build the iframe src. It isn't a secret
 * — the id ends up sitting right there in the iframe's `src` the moment
 * the page loads — this route exists so the env var doesn't need a
 * NEXT_PUBLIC_ prefix and stays read server-side, same pattern as the
 * rest of the app's client views (they fetch, they don't import env
 * config directly).
 *
 * `eventId: null` means "not configured" — the embed component just
 * doesn't render anything in that case.
 */
export async function GET() {
  const eventId = process.env.SLIDO_EVENT_ID?.trim() || null;
  return NextResponse.json({ eventId });
}
