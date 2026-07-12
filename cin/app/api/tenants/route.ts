import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  try {
    const rows = await sql`SELECT * FROM tenants ORDER BY created_at DESC`;
    const tenants = rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      sector: row.sector,
      bodyType: row.body_type,
      constituencyLabel: row.constituency_label,
      features: row.features || [],
      branding: row.branding || {},
      webexRoomId: row.webex_room_id ?? null,
      voteThreshold: row.vote_threshold ?? null,
    }));
    return NextResponse.json({ tenants });
  } catch (err: any) {
    console.error("GET /api/tenants error:", err);
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, slug, sector, bodyType, constituencyLabel, features, branding, webexRoomId, voteThreshold } = body;

  if (!name || !slug || !sector || !bodyType || !constituencyLabel) {
    return NextResponse.json(
      { error: "Missing required fields: name, slug, sector, bodyType, constituencyLabel" },
      { status: 400 },
    );
  }

  const cleanSlug = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleanSlug) {
    return NextResponse.json({ error: "Invalid tenant slug provided" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 500 });
  }

  try {
    const [inserted] = await sql`
      INSERT INTO tenants (
        slug, name, sector, body_type, constituency_label, features, branding, webex_room_id, vote_threshold
      )
      VALUES (
        ${cleanSlug},
        ${name},
        ${sector},
        ${bodyType},
        ${constituencyLabel},
        ${features || []},
        ${JSON.stringify(branding || {})}::jsonb,
        ${webexRoomId || null},
        ${Number.isFinite(voteThreshold) ? voteThreshold : null}
      )
      RETURNING *
    `;

    const formatted = {
      slug: inserted.slug,
      name: inserted.name,
      sector: inserted.sector,
      bodyType: inserted.body_type,
      constituencyLabel: inserted.constituency_label,
      features: inserted.features || [],
      branding: inserted.branding || {},
      webexRoomId: inserted.webex_room_id ?? null,
      voteThreshold: inserted.vote_threshold ?? null,
    };

    return NextResponse.json({ tenant: formatted }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/tenants error:", err);
    if (err.code === "23505" || err.message?.includes("unique")) {
      return NextResponse.json({ error: `Tenant slug '${cleanSlug}' already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Database error" }, { status: 500 });
  }
}
