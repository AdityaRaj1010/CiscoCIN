-- CIN — Civic Intelligence Network
-- Migration 0004_outcome_verification.sql
--
-- The pipeline's 4th stage ("Verification") claims: "Outcome recorded and
-- verified on the transparency ledger." Until now nothing in the app ever
-- produced that record — two seed proposals were just hardcoded straight
-- into the 'verification' stage with nothing backing the claim. This adds
-- the actual mechanism: whoever completed the work uploads a photo (and,
-- optionally, a note) as proof, and only then does the proposal move to
-- 'verification'. See lib/data.ts (`proposals.verify`) and
-- app/api/t/[tenant]/proposals/[id]/verify/route.ts.

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS verification_note TEXT,
  ADD COLUMN IF NOT EXISTS verification_photo TEXT, -- data URL (base64) of the proof-of-completion photo
  ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Anyone who already ran `node scripts/run-migrations.mjs` before this
-- migration existed has these two seed rows sitting at 'verification'
-- with no evidence — the exact bug being fixed. Correct them in place
-- (harmless no-op if they were never seeded, or already fixed).
UPDATE proposals SET stage = 'trigger'
  WHERE id IN ('xa-p5', 'dv-p4') AND stage = 'verification' AND verification_photo IS NULL;
