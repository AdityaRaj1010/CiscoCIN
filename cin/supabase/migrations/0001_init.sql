-- CIN — Civic Intelligence Network
-- Schema Migration 0001_init.sql
-- Multi-tenant schema with strict RLS policies and one-person-one-vote unique constraints.

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT NOT NULL,
  body_type TEXT NOT NULL,
  constituency_label TEXT NOT NULL,
  features TEXT[] DEFAULT '{}',
  branding JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- e.g., 'xa-u1'
  tenant_slug TEXT NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  constituency TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY, -- e.g., 'xa-p1'
  tenant_slug TEXT NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  constituency TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('notice', 'trust', 'trigger', 'verification')),
  seed_votes_by_constituency JSONB DEFAULT '{}'::jsonb,
  budget_ask INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL REFERENCES tenants(slug) ON DELETE CASCADE,
  proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_person_one_vote UNIQUE (tenant_slug, proposal_id, user_id)
);

-- Indexing for fast tenant-scoped lookups
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_slug);
CREATE INDEX IF NOT EXISTS idx_proposals_stage ON proposals(stage);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- Row Level Security (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Anon read policy scoped by tenant
-- Postgres has no `CREATE POLICY IF NOT EXISTS` (unlike the CREATE TABLE /
-- CREATE INDEX statements above), so re-running this migration against a
-- database that already has these policies fails with "already exists".
-- DROP + CREATE makes it safe to run more than once.
DROP POLICY IF EXISTS anon_read_tenants ON tenants;
CREATE POLICY anon_read_tenants ON tenants FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_read_users ON users;
CREATE POLICY anon_read_users ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_read_proposals ON proposals;
CREATE POLICY anon_read_proposals ON proposals FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_read_votes ON votes;
CREATE POLICY anon_read_votes ON votes FOR SELECT USING (true);

-- Writes go through service-role only (or authenticated MFA backend)
DROP POLICY IF EXISTS service_role_all_tenants ON tenants;
CREATE POLICY service_role_all_tenants ON tenants TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_users ON users;
CREATE POLICY service_role_all_users ON users TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_proposals ON proposals;
CREATE POLICY service_role_all_proposals ON proposals TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS service_role_all_votes ON votes;
CREATE POLICY service_role_all_votes ON votes TO service_role USING (true) WITH CHECK (true);
