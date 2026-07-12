-- CIN — Civic Intelligence Network
-- Migration 0002_webex.sql
-- Adds the columns the Webex integration needs.
--
-- webex_room_id on tenants is the load-bearing bit: one Webex bot serves
-- every tenant, and the inbound `roomId` on a webhook event resolves which
-- tenant a message or vote belongs to.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS webex_room_id TEXT UNIQUE;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'webex')),
  ADD COLUMN IF NOT EXISTS webex_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_tenants_webex_room ON tenants(webex_room_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_webex_message ON proposals(webex_message_id)
  WHERE webex_message_id IS NOT NULL;
