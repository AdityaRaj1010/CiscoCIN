import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";
import { proposals } from "@/lib/data";

// Data-URL string length cap. Base64 inflates ~33% over raw bytes, so this
// caps the actual photo at roughly 1.8MB — plenty for a phone photo
// downscaled client-side (see components/verify-proposal-modal.tsx),
// small enough not to make a Postgres row unreasonable to store/read.
const MAX_PHOTO_DATA_URL_LENGTH = 2_500_000;
const NOTE_MAX = 600;

/**
 * POST /api/t/[tenant]/proposals/[id]/verify
 *
 * The pipeline's 4th stage claims an outcome was "recorded and verified on
 * the transparency ledger" — this is the route that makes that true.
 * Requires a photo (stored as a data URL; there's no object-storage
 * bucket wired into this project, so the DB is the ledger for now — see
 * WEBEX_INTEGRATION.md's Slido section for the same "one env var, no new
 * infra" philosophy). Only works on a proposal currently at the
 * 'trigger' stage — see proposals.verify()'s guard.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const { tenant: tenantSlug, id } = await params;

  const tenant = await getTenant(tenantSlug);
  if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

  const existing = await proposals.get(tenantSlug, id);
  if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (existing.stage !== "trigger") {
    return NextResponse.json(
      { error: "Only a proposal at the Trigger to Action stage can be verified." },
      { status: 409 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const photo = typeof body?.photo === "string" ? body.photo : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, NOTE_MAX) : null;
  const verifiedBy =
    typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "CIN member";

  if (!photo.startsWith("data:image/")) {
    return NextResponse.json({ error: "A proof-of-completion photo is required." }, { status: 400 });
  }
  if (photo.length > MAX_PHOTO_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "That photo is too large — try a smaller image." }, { status: 400 });
  }

  try {
    const updated = await proposals.verify(tenantSlug, id, { photo, note, verifiedBy });
    if (!updated) {
      return NextResponse.json(
        { error: "This proposal was already verified or is no longer at Trigger to Action." },
        { status: 409 },
      );
    }
    const enriched = await proposals.get(tenantSlug, id);
    return NextResponse.json({ proposal: enriched ?? updated });
  } catch (err: any) {
    console.error("POST verify error:", err);
    return NextResponse.json({ error: err.message || "Couldn't record verification" }, { status: 500 });
  }
}
