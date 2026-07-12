-- CIN — Civic Intelligence Network
-- Migration 0003_webex_pipeline_rooms.sql
--
-- This is the "vote threshold → Webex room" integration, and it is a
-- deliberate override of the inbound-bot design from 0002_webex.sql /
-- cin-build-spec.md §7 (Webex space → chat command → proposal → ballot
-- card). That flow is left in place (it still works) but is no longer the
-- primary path. The primary path now runs the other direction:
--
--   member votes in the CIN web app → real vote count crosses a threshold
--   → CIN calls the Webex API to CREATE a space for that proposal, adds
--   the configured moderator(s) to it (so it shows up in *their* Webex
--   account, not just the bot's), and posts the proposal + a ballot card
--   into it → the proposal's pipeline stage advances to "trigger".
--
-- See WEBEX_INTEGRATION.md for the full write-up.

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS webex_room_id TEXT,
  ADD COLUMN IF NOT EXISTS webex_room_created_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_webex_room ON proposals(webex_room_id)
  WHERE webex_room_id IS NOT NULL;

-- Optional per-tenant override of WEBEX_VOTE_THRESHOLD (env). NULL means
-- "use the env default" — most tenants will never set this.
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS vote_threshold INTEGER;
