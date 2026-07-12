# CivicOS — Campus Democracy OS

One React codebase that themes and feature-scopes itself per client (university,
panchayat, NGO) at runtime. Each tenant is a config row; flipping tenants
re-themes the whole app and changes which modules exist. Flagship tenant:
**Campus Democracy OS**.

> Hackathon UI build — clickable demo on mock data. No backend. All data flows
> through a single `src/api/` seam that returns Promises, so a real
> Supabase/Flask layer can drop in without touching the screens.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## The demo path

1. **Login** — branded per tenant, pick a demo account → simulated **Duo** MFA.
2. **Proposal feed** — tenant-scoped, filter by pipeline stage, sort.
3. **Proposal detail** — the 4-stage trust pipeline strip; **Vote** triggers Duo
   MFA, records one vote per member, updates the per-constituency breakdown.
4. **Live tally** — animated, grouped by department/ward, ticks as votes land.
5. **Provisioner** (`/provision`, or the system-bar switcher) — name a client,
   pick a sector/colors/modules → **Create**. The new tenant goes live in the
   switcher immediately, fully themed and walkable with seeded content.
6. **Tenant switcher** (system bar) — flip between St. Xavier's College (blue,
   participatory budgeting) and Devgaon Panchayat (green, Bhashini multilingual)
   and watch the whole surface re-theme.

## Architecture

| Concern | Where |
|---|---|
| Tenants (config rows) | `src/config/tenants.ts` |
| Feature-module catalog (17) | `src/config/modules.ts` |
| Tenant resolve + theming + `hasFeature()` | `src/context/TenantContext.tsx` |
| Mock API (the only data seam) | `src/api/index.ts` |
| Seed data (users, proposals) | `src/api/mock/` |
| Mutable state (tenants, votes, session) | `src/lib/store.ts` → localStorage |
| Screens | `src/pages/` |

Theming is CSS custom properties (`--primary` / `--accent`) set on `:root` from
the active tenant's branding; features gate nav, routes, and modules live.

Reset all demo state with the ↺ button in the system bar.
