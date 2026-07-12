# Webex integration — vote-threshold → auto-created room

This overrides the Webex design in `cin-build-spec.md` §7 / Phases 3–4
(chat command → proposal, ballot card → vote). That inbound flow is still
in the codebase and still works, but it is **not** the primary integration
anymore. The primary flow now runs the other direction, per your request:

> When a threshold of votes is crossed, automatically create a Webex room
> — and I can see that room in my own Webex account — as part of the
> pipeline.

## How it works

1. A member votes on a proposal in the CIN web app (the Endorse button on
   `/t/[tenant]/p/[id]`, now wired to a real backend — see below).
2. CIN counts that proposal's **real** votes (votes actually cast through
   the app — not the seed baseline used for the demo tally numbers).
3. Once that count crosses the threshold (`WEBEX_VOTE_THRESHOLD`, or a
   per-tenant override), CIN calls the Webex REST API to:
   - `POST /v1/rooms` — create a brand-new space, titled after the tenant
     and the proposal.
   - `POST /v1/memberships` for every address in `WEBEX_NOTIFY_EMAILS` —
     this is what makes the room show up in **your** Webex account. A
     room created with a bot token is otherwise only visible to the bot;
     adding your own Webex email as a member is what puts it in your
     spaces list.
   - `POST /v1/messages` — post the proposal (title, summary, vote count,
     a link back to CIN) into the new room.
   - `POST /v1/messages` with an Adaptive Card attachment — the same
     ballot card the inbound flow uses, so voting can continue inside
     Webex from there if you want.
4. The proposal is updated: `webex_room_id` is stored (so this only ever
   happens once per proposal — see the unique index in
   `0003_webex_pipeline_rooms.sql`), and its pipeline stage advances to
   **Trigger to Action** — "threshold met, routed to the body that can
   act" is exactly what `lib/pipeline.ts` already says that stage means,
   and the Webex room *is* that routing.
5. The web app shows it back to you immediately: a "Webex room open" badge
   on the proposal card and detail page, with an "Open in Webex" link
   (a `webexteams://` deep link — Webex spaces don't have a documented web
   URL, but this deep-link scheme is the supported way to jump straight
   into a space you're already a member of).

## What actually changed in the code

- **The Endorse button was fake.** `detail-client.tsx`'s `onVerified` only
  did `setState` before — nothing was persisted, in Webex or the database.
  It now calls `POST /api/t/[tenant]/proposals/[id]/vote`
  (`app/api/t/[tenant]/proposals/[id]/vote/route.ts`, new), which persists
  a real vote via the existing `castVote()` helper (the same one the
  inbound ballot card used) and then checks the threshold.
- `lib/cisco/webex.ts` — added `createRoom`, `addRoomMember`, and
  `webexSpaceDeepLink`. The inbound-flow functions (`getMessage`,
  `postCard`, `verifyWebexSignature`, etc.) are untouched and still used —
  the new room reuses `postMessage`/`postCard`/`buildBallotCard`.
- `lib/cisco/webex-pipeline.ts` (new) — the orchestration: threshold
  check, room creation, member invites, message + ballot card, and
  handing off to `lib/data.ts` to persist the result. This is where
  `WEBEX_VOTE_THRESHOLD` and `WEBEX_NOTIFY_EMAILS` are read.
- `lib/data.ts` — `proposals.realVoteCount()` (real, non-seed vote count
  for one proposal) and `proposals.attachWebexRoom()` (idempotent — only
  the first caller wins, guarded by `webex_room_id IS NULL`, and it's what
  advances the stage to `trigger`). `Proposal`/`ProposalView` gained
  `webexRoomId` and a derived `webexRoomUrl`.
- `lib/tenant.ts` — `Tenant.voteThreshold`, an optional per-tenant
  override of the env default.
- `supabase/migrations/0003_webex_pipeline_rooms.sql` (new) —
  `proposals.webex_room_id` (unique), `proposals.webex_room_created_at`,
  `tenants.vote_threshold`.
- `components/proposal-card.tsx` / `detail-client.tsx` — the "Webex room
  open" badge and link described above.
- `.env.example` — `WEBEX_VOTE_THRESHOLD`, `WEBEX_NOTIFY_EMAILS`.

## Setup

You need the same Webex bot as the spec's original design —
`WEBEX_BOT_TOKEN` from a bot registered at
https://developer.webex.com/my-apps — this flow doesn't need a webhook or
`WEBEX_WEBHOOK_SECRET` at all (nothing is inbound), though you can still
set those up if you want the chat-command flow too.

```bash
WEBEX_BOT_TOKEN=<your bot's access token>
WEBEX_VOTE_THRESHOLD=5              # real votes needed to trigger a room
WEBEX_NOTIFY_EMAILS=you@example.com # your Webex account email(s), comma-separated
APP_URL=http://localhost:3000       # used to build the "open in CIN" link posted into the room
```

`WEBEX_NOTIFY_EMAILS` is the important one for "I want to see the room in
my own Webex account" — put your real Webex-registered email address
there. Every address listed is added as a moderator of every room the
integration creates.

## Demoing it

1. Set the env vars above and `DATABASE_URL` (voting requires the
   database — same as the rest of the app).
2. Run migrations: `node scripts/run-migrations.mjs`.
3. Open a proposal on `/t/xaviers/proposals` (or lower
   `WEBEX_VOTE_THRESHOLD` to 1 for a one-click demo) and hit **Endorse**
   enough times from different browsers/incognito windows to cross the
   threshold — one vote per browser identity, same one-person-one-vote
   rule as before.
4. On the vote that crosses the threshold, the response includes the new
   room; the page shows the "Webex room open" banner immediately, and the
   room appears in your Webex app's spaces list within a few seconds.

## Slido poll embed

A live Slido poll is embedded above the proposals list on every tenant's
`/t/[tenant]/proposals` page — set `SLIDO_EVENT_ID` in `.env`/`.env.local`
and it shows up automatically (unset → nothing renders, no error).

- `app/api/config/slido/route.ts` hands the id to the client (kept out of
  `NEXT_PUBLIC_` so it stays server-controlled, even though it's not
  actually secret — see the comment in that file).
- `components/slido-embed.tsx` renders `https://app.sli.do/event/<id>/polls`
  in an iframe, collapsible, with an "Open in Slido" link out.
- One event id, shared across all tenants for now. If you want a
  different Slido event per tenant later, this is the file to extend —
  same shape as `tenants.vote_threshold` in `WEBEX_INTEGRATION.md`.



Duo, Meraki, Supabase Realtime, and the `/admin` control-plane shape —
see `AUDIT_AND_WEBEX_NOTES.md`. Voting is still gated by a per-browser
cookie identity instead of a verified Duo session, same caveat that
already applied to the inbound Webex ballot card.
