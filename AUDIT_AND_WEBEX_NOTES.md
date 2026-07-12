# CIN — audit + Webex integration notes

> **Update:** this file documents the original, inbound (`propose:` chat
> command + ballot card) Webex integration described in
> `cin-build-spec.md` §7. That code is still present and still works, but
> it has been superseded as the primary Webex flow by a vote-threshold →
> auto-created-room integration. See **`WEBEX_INTEGRATION.md`** for that
> (newer, primary) flow and what changed. The rest of this file is kept
> as-is for the record.

## 🔴 Rotate your Supabase password now

`cin/scripts/run-migrations.mjs` had a **live Supabase host + database
password hardcoded in plain text** (`db.yclgmvhyzrujbpasoxqx.supabase.co`,
password committed in the repo). If this repo has ever been pushed anywhere
outside your own machine, treat that password as burned and rotate it in
the Supabase dashboard immediately. The script has been rewritten to read
`DATABASE_URL` from the environment instead — same as `lib/db.ts` — per the
spec's own rule against hardcoding credentials.

## What was already implemented (Phase 0–2, mostly)

- Next.js scaffold, Tailwind, ported components — good, byte-faithful port.
- Tenant plane: `middleware.ts`, `lib/tenant.ts`, `modules/registry.ts` +
  12 manifests, the `[module]` dispatcher with correct 404 semantics
  (unknown tenant, off-feature, capability-not-page all 404 correctly).
- `POST /api/tenants` inserts a real row and persists across refresh.
- Full rebrand — no leftover "CivicOS" strings anywhere.

## What was missing (confirmed by reading every file, not just names)

1. **Webex — nothing existed.** No `lib/cisco/webex.ts`, no webhook route,
   no `webex_room_id` column, no signature verification, no message
   ingestion, no ballot card, no vote-from-card handling. *(This is what
   this pass builds — see below.)*
2. **Vote casting was entirely fake**, in-app and out. The Endorse button in
   `detail-client.tsx` only did an optimistic local `setState` — nothing
   was ever persisted, and it reset on refresh. There was no votes-insert
   path anywhere in the codebase before this change.
3. **Duo — left alone, as asked.** `duo-modal.tsx` (UI) exists but is purely
   a client-side simulation; there's no `lib/cisco/duo.ts`, no
   `/api/callback/duo`, no `/t/[tenant]/login` route, no session cookie
   (`lib/session.ts` was never created), and nothing actually gates
   `voting` behind a verified session.
4. **Meraki — left alone, as asked.** No references beyond the `requires`
   type union. Not started.
5. **Admin control plane doesn't match the spec's shape.** There's a
   `/provision` page instead of `/admin/new`, and `/admin` (tenant list) +
   `/admin/[tenant]` (flip flags on a live tenant) don't exist at all.
6. **`lib/db.ts` deviates from the spec.** It's a single `postgres` client
   keyed off one `DATABASE_URL`, not the two-tier Supabase JS setup (anon
   key client-side, service-role key server-side) the spec describes.
   Functionally it works, but there's no anon/service-role separation —
   every server-side query runs with full privileges. Worth revisiting
   before this goes anywhere near production traffic.

## What this pass added — the Webex part

- `supabase/migrations/0002_webex.sql` — adds `tenants.webex_room_id`
  (the tenant-resolution key for inbound events) and
  `proposals.source` / `proposals.webex_message_id`.
- `lib/cisco/webex.ts` — signature verification (HMAC-SHA1 over the raw
  body, constant-time compare), bot-echo guard, `getMessage` /
  `getAttachmentAction` (webhooks never carry the actual text), `postMessage`
  / `postCard`, a `propose:` command parser, and the Adaptive Card ballot
  builder.
- `app/api/webex/webhook/route.ts` — one route, both subscriptions:
  `messages:created` ingests a `propose:` message into a new proposal and
  replies with a ballot card; `attachmentActions:created` reads the card
  submission and casts a vote, replying "already voted" on a duplicate
  (relies on the existing `one_person_one_vote` unique index, not app logic).
- `lib/votes.ts` — shared vote-casting helper (upserts a lightweight user
  row for a first-time Webex voter, inserts the vote, translates the
  Postgres `23505` duplicate error into a typed result). This is written so
  an in-app Endorse button can reuse it once Duo actually gates it.
- `lib/data.ts` — `proposals.list/get` and `tally.get` now read from
  Postgres when `DATABASE_URL` is set (falling back to the seed arrays
  otherwise, same pattern as `lib/tenant.ts`), and real vote counts are
  merged on top of the seed baseline. Added `proposals.create(...)` for
  the webhook to call, with duplicate-message protection.
- `lib/tenant.ts` — added `getTenantByWebexRoom(roomId)`.
- `app/api/t/[tenant]/{proposals,proposals/[id],tally}/route.ts` — new,
  and necessary: the client Views (`ProposalsView`, `TallyView`,
  `BudgetingView`, `ProposalDetailClient`) call `lib/data.ts` from the
  browser, and `lib/data.ts` now imports the `postgres` driver. Importing a
  server-only DB driver into a client bundle breaks the build (confirmed —
  it did, until this fix), so those views now fetch through these thin API
  routes instead of importing `lib/data.ts`'s runtime exports directly.
  Type-only imports from `lib/data.ts` are still used and are fine (erased
  at compile time).
- `modules/tally/View.tsx` — polls every 4s instead of fetching once, so a
  vote cast in Webex shows up without a manual refresh. This is **not**
  Supabase Realtime (that needs its own client + project credentials,
  which weren't invented per the spec's rule) — it's a pragmatic stand-in
  that gets the same felt behavior for the demo.
- `POST /api/tenants` now accepts an optional `webexRoomId` so a new
  tenant can be bound to a Webex space at creation time (the provisioner
  UI itself wasn't extended with a field for this — out of scope for "the
  Webex part").
- `.env.example` — documents every env var from spec §8.

## Verified

- `npx tsc --noEmit` — clean.
- `npx next build` — compiles and generates all routes successfully.

## Still not done (unchanged, on purpose)

Duo (Phase 5), Meraki, Supabase Realtime, and the `/admin` control-plane
shape are all untouched, per your instructions.
