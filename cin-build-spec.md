# CIN — Civic Intelligence Network — Build Spec

> ## ⚠️ OVERRIDDEN — Webex integration direction
> Everything in this file describing Webex as an **inbound** channel — a
> bot in a Webex space that ingests a `propose:` chat command into a new
> proposal, and an Adaptive Card ballot that ingests votes back — was
> superseded by request. Sections affected: **§3a `requires`/`voting`
> note**, **§3c schema notes on `webex_room_id`**, **Phase 3**,
> **Phase 4**, and **§7 "Cisco integration notes"**. They're left below
> unmodified for reference (and the code they describe still exists and
> still works — nothing was deleted), but they are no longer the primary
> Webex flow.
>
> **The primary flow now runs the other direction:** a vote cast in the
> CIN web app crosses a threshold → CIN calls the Webex API to create a
> **new** room for that proposal and adds a real person's Webex account as
> a member of it (so it's visible in their own Webex client, not just the
> bot's) → the proposal advances to the `trigger` pipeline stage. See
> **`WEBEX_INTEGRATION.md`** at the repo root for the full design and
> setup steps.

> **How to use this file:** drop it in the repo root, then tell your coding agent:
> *"Read `cin-build-spec.md`. Do Phase 0 and Phase 1 only. Stop at the acceptance checks and show me the result."*
> Then Phase 2, then 3. **Do not let it do all six in one shot** — you won't be able to tell which phase broke.

---

## 0. Context

There is an existing working Vite + React app (`src/`, dev server on `:5174`). It looks good and the UI is worth keeping almost verbatim. It has **no backend at all** — `src/api/index.ts` reads from `src/api/mock/*`, and the current tenant lives in `localStorage` → `TenantContext`.

We are porting it to **Next.js (App Router)** and building the tenant plane and one live vertical for real.

**Rebrand while porting.** The old app is branded **CivicOS** throughout. The product is now **CIN — Civic Intelligence Network**. As you port each file, replace the string. The known places: the `<title>` (`"CivicOS — Campus Democracy OS"`), the wordmark in `components/system-bar.tsx`, the login copy (*"Sign in to Students' Union on CivicOS"*), the provisioner eyebrow (`CIVICOS · PROVISIONER` → `CIN · PROVISIONER`), the `civicos.session.v1` localStorage key (which is being deleted anyway), and the package name. Grep for `civicos` case-insensitively before you call a phase done — there will be more than you expect.

**Working method:** scaffold the Next app into a *sibling folder*, port into it, and keep the Vite app running on `:5174` the whole time so both the agent and I can look at it. Do not delete the Vite app until Next reaches parity.

---

## 1. The one architectural rule

**The feature flag is the router, not a conditional.**

Everything else follows from this. Today the tenant is a global variable (`TenantContext`) and `/budgeting` is a top-level route that renders for any tenant. After this migration:

- The tenant is in the **URL**: `/t/xaviers/tally`, never `/tally`.
- A module that is **off** for a tenant does not render a hidden nav item — **its URL 404s.**
- An **unknown** tenant slug 404s. It must never fall back to a default tenant. (It currently does: setting `tenantId:"devgaon"` silently serves St. Xavier's. That is the shape of a cross-tenant leak.)

If any code you write ends up doing `{tenant.features.includes('x') && <X/>}` to decide whether a *page* exists, you have done it wrong.

---

## 2. Target structure

```
cin/
├─ middleware.ts                        ← the dispatcher
├─ app/
│  ├─ page.tsx                            CIN landing + tenant directory
│  ├─ admin/                            ← CONTROL PLANE (the parent app)
│  │  ├─ page.tsx                         tenant list
│  │  ├─ new/page.tsx                     provisioner  ← port ProvisionPage.tsx
│  │  └─ [tenant]/page.tsx                flip flags on a live tenant
│  ├─ t/[tenant]/                       ← DATA PLANE (a child app)
│  │  ├─ layout.tsx                       loads tenant row → theme + nav from manifests
│  │  ├─ page.tsx                         redirect → first enabled page-module
│  │  ├─ login/page.tsx                   Duo    ← port LoginPage.tsx
│  │  ├─ [module]/page.tsx              ★ THE DISPATCHER
│  │  └─ p/[id]/page.tsx                  proposal detail ← port ProposalDetailPage.tsx
│  └─ api/
│     ├─ tenants/route.ts                 POST = provision (writes the config row)
│     ├─ webex/webhook/route.ts           ① ingest messages  ② ingest card votes
│     ├─ pipeline/trigger/route.ts        threshold → advance stage
│     └─ callback/duo/route.ts            Duo Universal redirect target
├─ modules/                             ★ THE REGISTRY — one folder per feature
│  ├─ types.ts
│  ├─ registry.ts                         MANIFESTS — pure data, server-safe
│  ├─ views.tsx                           VIEWS — component map, dispatcher-only
│  ├─ proposals/{manifest.ts, View.tsx}
│  ├─ tally/{manifest.ts, View.tsx}
│  ├─ budgeting/{manifest.ts, View.tsx}
│  ├─ voting/manifest.ts                  capability — no View
│  └─ …8 more, status: 'preview'
├─ components/                            ported verbatim — DO NOT REDESIGN
│  ├─ ui/{avatar,button,field,modal}.tsx
│  └─ {proposal-card,pipeline,duo-modal,language-toggle,system-bar}.tsx
├─ lib/
│  ├─ tenant.ts                           getTenant(slug), listTenants()
│  ├─ data.ts                             replaces src/api/index.ts — same signatures
│  ├─ db.ts                               supabase clients (anon + service-role)
│  ├─ session.ts                          cookie session (replaces SessionContext)
│  ├─ pipeline.ts                         ← src/config/pipeline.ts, verbatim
│  └─ cisco/{webex.ts, duo.ts, meraki.ts}
└─ supabase/
   ├─ migrations/0001_init.sql
   └─ seed.sql                            ← from src/config/tenants.ts + src/api/mock/*
```

---

## 3. The three primitives

### 3a. Manifest — pure data, no JSX, no component reference

Two kinds of module. This distinction matters — `voting` is not a page.

```ts
// modules/types.ts
export type ModuleKind = 'page' | 'capability'
export type ModuleStatus = 'live' | 'preview'

export type ModuleManifest = {
  id: string
  label: string
  blurb: string
  kind: ModuleKind          // 'page' → gets a route + nav item
                            // 'capability' → gates behaviour inside other modules
  status: ModuleStatus      // 'preview' → renders a stub + badge (your existing SOON chips)
  core?: boolean            // shown as CORE in the provisioner
  requires?: ('duo' | 'webex' | 'meraki' | 'bhashini')[]
  nav?: { order: number; icon: string }   // required iff kind === 'page'
}
```

The 12 modules, from the current provisioner UI:

| id | kind | status | nav |
|---|---|---|---|
| `proposals` | page | live | 1 |
| `voting` | **capability** | live | — |
| `tally` | page | live | 2 |
| `budgeting` | page | live | 3 |
| `townhalls` `petitions` `polls` `elections` `committees` `noticeboard` `surveys` `analytics` | page | preview | 4–11 |

`voting` gates the Endorse button and the Webex ballot card. It must **not** get a `/voting` route.

### 3b. Registry — two files, deliberately split

```ts
// modules/registry.ts   — imported by server code (layout, middleware, admin). No components.
export const MANIFESTS: Record<ModuleId, ModuleManifest> = { proposals, voting, tally, ... }
export const PAGE_MODULES = Object.values(MANIFESTS).filter(m => m.kind === 'page')

// modules/views.tsx     — imported ONLY by app/t/[tenant]/[module]/page.tsx
export const VIEWS: Record<string, React.ComponentType<{ tenant: Tenant }>> = { proposals: ProposalsView, ... }
```

Keeping components out of `registry.ts` is what stops the nav in `layout.tsx` from pulling every module's client bundle in.

### 3c. Dispatcher — this is the whole idea

```tsx
// app/t/[tenant]/[module]/page.tsx
export default async function ModulePage({ params }) {
  const { tenant: slug, module } = await params        // Next 15: params is a Promise
  const tenant = await getTenant(slug)

  if (!tenant) notFound()                              // unknown tenant → 404, NEVER a fallback
  const m = MANIFESTS[module]
  if (!m || m.kind !== 'page') notFound()              // 'voting' has no page
  if (!tenant.features.includes(module)) notFound()    // flag OFF → this URL does not exist

  if (m.status === 'preview') return <PreviewStub manifest={m} tenant={tenant} />
  const View = VIEWS[module]
  return <View tenant={tenant} />
}
```

Also add `generateStaticParams` returning nothing (fully dynamic) — do not try to pre-render tenants.

### 3d. Middleware

```ts
// middleware.ts — path-based is the default and needs zero DNS.
// The host-based branch is the same file if we ever buy a domain.
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const sub = host.split(':')[0].split('.')[0]
  const isSubdomainTenant = !host.startsWith('localhost')
    && !['www', 'cin', 'vercel'].includes(sub)
    && host.split('.').length > 2

  if (isSubdomainTenant && !req.nextUrl.pathname.startsWith('/t/')) {
    return NextResponse.rewrite(new URL(`/t/${sub}${req.nextUrl.pathname}`, req.url))
  }
}
export const config = { matcher: ['/((?!_next|api|favicon.ico).*)'] }
```

---

## 4. Schema

`supabase/migrations/0001_init.sql`:

```sql
create table tenants (
  slug               text primary key,          -- 'xaviers'
  name               text not null,
  sector             text not null,             -- education | government | ngo | corporate_csr
  body_type          text,                      -- "Students' Union" / "Gram Sabha"
  constituency_label text,                      -- "Department" / "Ward"
  features           text[] not null default '{}',
  brand              jsonb  not null default '{}',   -- { primary, accent, initials }
  webex_room_id      text,                      -- ← how an inbound Webex message finds its tenant
  created_at         timestamptz default now()
);

create table users (
  id text primary key,
  tenant_slug text not null references tenants(slug) on delete cascade,
  name text not null, role text, constituency text, avatar_hue text
);

create table proposals (
  id text primary key,
  tenant_slug text not null references tenants(slug) on delete cascade,
  title text not null, body text, tags text[] default '{}',
  cost_paise bigint, constituency text,
  stage int not null default 1,           -- 1..4  Notice&Input / Trust / Trigger / Verification
  author_id text references users(id),
  source text not null default 'web',     -- 'web' | 'webex'
  webex_message_id text,
  created_at timestamptz default now()
);

create table votes (
  id uuid primary key default gen_random_uuid(),
  tenant_slug text not null references tenants(slug) on delete cascade,
  proposal_id text not null references proposals(id) on delete cascade,
  user_id text not null,
  created_at timestamptz default now()
);

-- one person, one vote — enforced by the database, not by application logic
create unique index one_person_one_vote on votes (proposal_id, user_id);

alter table proposals enable row level security;
alter table votes     enable row level security;
alter table users     enable row level security;
-- Anon read policy scoped by tenant_slug; writes go through the service-role client only.
```

`webex_room_id` on the tenant row is the load-bearing bit: **one Webex bot serves every tenant, and the inbound `roomId` resolves which tenant a message belongs to.** That is multi-tenancy proven at the integration layer, not just in the database.

Seed two tenants from the existing `src/config/tenants.ts` + `src/api/mock/*`:
- `xaviers` — education, features `[proposals, voting, tally, budgeting]`
- `devgaon` — government, features `[proposals, voting, tally]` ← deliberately **no budgeting**, so `/t/devgaon/budgeting` 404s on camera.

---

## 5. Port map

| From | → | To |
|---|---|---|
| `pages/FeedPage.tsx` | → | `modules/proposals/View.tsx` |
| `pages/TallyPage.tsx` | → | `modules/tally/View.tsx` |
| `pages/BudgetingPage.tsx` | → | `modules/budgeting/View.tsx` |
| `pages/ProposalDetailPage.tsx` | → | `app/t/[tenant]/p/[id]/page.tsx` |
| `pages/LoginPage.tsx` | → | `app/t/[tenant]/login/page.tsx` |
| `pages/ProvisionPage.tsx` | → | `app/admin/new/page.tsx` |
| `components/app-shell.tsx` | → | `app/t/[tenant]/layout.tsx` (nav built from `PAGE_MODULES ∩ tenant.features`) |
| `components/ui/*`, `proposal-card`, `pipeline`, `duo-modal` | → | **verbatim**, do not restyle |
| `config/pipeline.ts` | → | `lib/pipeline.ts` verbatim |
| `config/modules.ts` | → | 12 × `modules/*/manifest.ts` |
| `config/tenants.ts`, `api/mock/*` | → | `supabase/seed.sql` |
| `api/index.ts` | → | `lib/data.ts` — **keep the same function names and signatures**, swap the body to Supabase |
| `context/TenantContext.tsx` | → | **DELETE** (tenant comes from the URL) |
| `context/SessionContext.tsx` | → | `lib/session.ts` — httpOnly cookie |
| `lib/store.ts` | → | **DELETE** |
| `react-router-dom` | → | **uninstall** |
| `context/LanguageContext.tsx` | → | keep as-is, client context is fine for i18n |

Porting a page is mechanical: delete `useTenant()` and take `tenant` as a prop; `<Link to>` → `next/link`; add `'use client'` **only** to files that use hooks or handlers.

---

## 6. Build order — stop at each ✅

### Phase 0 — scaffold
`create-next-app` (TypeScript, Tailwind, App Router, `src/` off). Copy `components/ui/*`, `index.css`, the fonts, `config/pipeline.ts`. Get a blank page rendering with the existing look.
**✅** A button from `components/ui/button.tsx` renders with correct fonts and colours.

### Phase 1 — the tenant plane *(no Cisco, no auth yet)*
Migration + seed. `lib/db.ts`, `lib/tenant.ts`, `lib/data.ts`. `modules/` registry + manifests. `middleware.ts`. `app/t/[tenant]/layout.tsx` + dispatcher. Port Feed / Tally / Budgeting.
**✅ All four must pass:**
1. `/t/xaviers/tally` renders, seeded data, Xavier's branding.
2. `/t/devgaon/tally` renders with **different** branding and different data.
3. `/t/devgaon/budgeting` returns **404** — not a redirect, not an empty page.
4. `/t/nonsense/tally` returns **404** — not St. Xavier's.

> Phase 1 is the whole thesis. If it passes, the rest is decoration.

### Phase 2 — the provisioner actually writes a row
`POST /api/tenants` → insert. Port `ProvisionPage.tsx` to `/admin/new` and point the submit at it.
**✅** Create "Devgaon Panchayat" in the UI → **hard refresh** → it is still in the list → `/t/devgaon` loads. (Today it evaporates.)

### Phase 3 — Webex ingest  *(superseded — see the notice at the top of this file and `WEBEX_INTEGRATION.md`)*
`lib/cisco/webex.ts` + `POST /api/webex/webhook`. Handle `messages:created`.
**✅** Type a message in the Webex space → a proposal appears in `/t/xaviers/proposals` at stage 1.

### Phase 4 — the vote loop *(the money shot)* *(superseded — see the notice at the top of this file)*
Bot replies with an **Adaptive Card** ballot. Handle `attachmentActions:created` → insert a vote. Duplicate → `23505` → bot replies "you already voted." Supabase Realtime on `votes` → tally updates live.
**✅** Tap **Approve** in Webex → the bar on `/t/xaviers/tally` moves **without a refresh**. Tap again → bot refuses.

### Phase 4b — vote-threshold → Webex room *(this is the flow that's actually implemented — see `WEBEX_INTEGRATION.md`)*
Endorse button in the web app → `POST /api/t/[tenant]/proposals/[id]/vote` → real vote persisted → `lib/cisco/webex-pipeline.ts` checks the real vote count against `WEBEX_VOTE_THRESHOLD` (or a per-tenant override) → on crossing it, creates a Webex room, adds `WEBEX_NOTIFY_EMAILS` as members, posts the proposal + a ballot card into it, and advances the proposal to `trigger`.
**✅** Endorse a proposal enough times (different browser identities) to cross the threshold → a new space appears in your own Webex account, and the proposal detail page shows an "Open in Webex" link, with no polling delay needed since the vote response includes it directly.

### Phase 5 — Duo
`lib/cisco/duo.ts` + `/api/callback/duo`. Gate `voting` behind a verified session.
**✅** `/t/xaviers/login` redirects to the real Duo prompt and comes back with a session.

### Phase 6 — deploy
Vercel. Re-point the Webex webhook at the production URL.

---

## 7. Cisco integration notes — read these before writing the webhook *(applies to the superseded inbound flow — see notice at top of file)*

These four things will cost you an evening each if you find them by trial and error:

1. **The webhook payload does not contain the message text.** Webex sends you `{ id, roomId, personId, personEmail }`. You must then `GET https://webexapis.com/v1/messages/{id}` with the bot token to read it. Same for card actions: `GET /v1/attachment/actions/{id}` returns the `inputs`.
2. **The bot will hear itself.** Every message the bot posts fires the webhook again. Drop any event where `data.personId === WEBEX_BOT_PERSON_ID`, or you get an infinite loop within seconds.
3. **In a group space the bot only receives messages that @mention it.** In a 1:1 space it receives everything. Demo in a group space and design the command accordingly (`@CIN propose: …`).
4. **Two webhooks, not one.** Register `resource: messages, event: created` *and* `resource: attachmentActions, event: created`. Both can point at the same route; branch on `body.resource`.

Verify the `X-Spark-Signature` header (HMAC-SHA1 of the raw body with `WEBEX_WEBHOOK_SECRET`) before trusting anything. Read the raw body before parsing.

**Duo kill switch:** put `DUO_MODE=mock|live` in env. When `mock`, keep the existing `duo-modal.tsx` simulation. Duo signup can stall, and the demo must never be blocked on it.

---

## 8. Env — expected names. Do not invent values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only — never in a NEXT_PUBLIC_ var

WEBEX_BOT_TOKEN=
WEBEX_BOT_PERSON_ID=
WEBEX_WEBHOOK_SECRET=

# Added by the vote-threshold → Webex room override — see WEBEX_INTEGRATION.md
WEBEX_VOTE_THRESHOLD=
WEBEX_NOTIFY_EMAILS=

DUO_MODE=mock                   # mock | live
DUO_CLIENT_ID=
DUO_CLIENT_SECRET=
DUO_API_HOST=
DUO_REDIRECT_URI=

MERAKI_API_KEY=                 # DevNet always-on sandbox
MERAKI_ORG_ID=

APP_URL=http://localhost:3000
```

---

## 9. Do not

- Do **not** invent, guess, or hardcode any API key, token, org ID, or URL. If a value is missing, stop and ask.
- Do **not** run migrations against a remote Supabase project. Write the SQL to `supabase/migrations/` and tell me to paste it into the SQL editor.
- Do **not** recreate `TenantContext` or any global "current tenant" store. The tenant is a route param.
- Do **not** fall back to a default tenant on an unknown slug. `notFound()`.
- Do **not** gate a *page* with a JSX conditional. Gate it in the dispatcher.
- Do **not** put domain data in `localStorage`.
- Do **not** add a Python/Flask service. Route handlers are the backend.
- Do **not** restyle `components/ui/*`, `proposal-card`, or `pipeline`. Port them byte-for-byte. The existing design is not the problem.
- Do **not** proceed past a phase whose ✅ checks fail.
