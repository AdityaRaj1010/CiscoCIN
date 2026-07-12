/**
 * lib/cisco/webex-pipeline.ts
 *
 * The "your way" Webex integration: when a proposal's REAL vote count
 * (votes actually cast through this app — not the seed baseline used for
 * the demo tally numbers) crosses a threshold, CIN:
 *
 *   1. creates a brand-new Webex space via the Rooms API,
 *   2. adds the configured moderator email(s) (WEBEX_NOTIFY_EMAILS) as
 *      members, so the space shows up in *their* Webex account — not just
 *      the bot's — the moment it's created,
 *   3. posts the proposal into it (with a link back to CIN) plus the same
 *      Adaptive Card ballot the inbound flow uses, so the conversation can
 *      continue in Webex,
 *   4. advances the proposal to the "trigger" pipeline stage — this *is*
 *     "Trigger to Action: routed to the body that can act" (see
 *     lib/pipeline.ts) — the Webex room is that routing.
 *
 * This is idempotent: a proposal only ever gets one room
 * (proposals.webex_room_id is unique), so re-checking on every vote is
 * safe and cheap.
 */
import { createRoom, addRoomMember, postMessage, postCard, buildBallotCard, webexSpaceDeepLink } from "@/lib/cisco/webex";
import { proposals, type ProposalView } from "@/lib/data";
import type { Tenant } from "@/lib/tenant";

/** Used when neither the tenant row nor the env var sets a threshold. */
const FALLBACK_VOTE_THRESHOLD = 5;

export function defaultVoteThreshold(): number {
  const fromEnv = Number(process.env.WEBEX_VOTE_THRESHOLD);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : FALLBACK_VOTE_THRESHOLD;
}

function notifyEmails(): string[] {
  return (process.env.WEBEX_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

export interface PipelineRoomResult {
  created: boolean;
  roomId?: string;
  roomUrl?: string | null;
  threshold: number;
  realVoteCount: number;
  skippedReason?: string;
}

export async function maybeCreatePipelineRoom(params: {
  tenant: Tenant;
  proposal: ProposalView;
  realVoteCount: number;
}): Promise<PipelineRoomResult> {
  const { tenant, proposal, realVoteCount } = params;
  const threshold = tenant.voteThreshold ?? defaultVoteThreshold();

  if (proposal.webexRoomId) {
    return {
      created: false,
      roomId: proposal.webexRoomId,
      roomUrl: webexSpaceDeepLink(proposal.webexRoomId),
      threshold,
      realVoteCount,
      skippedReason: "room already exists for this proposal",
    };
  }

  if (realVoteCount < threshold) {
    return { created: false, threshold, realVoteCount, skippedReason: "below threshold" };
  }

  if (!process.env.WEBEX_BOT_TOKEN) {
    console.warn("Vote threshold crossed but WEBEX_BOT_TOKEN is not configured — skipping room creation.");
    return { created: false, threshold, realVoteCount, skippedReason: "WEBEX_BOT_TOKEN not configured" };
  }

  const title = `${tenant.name} · ${proposal.title}`.slice(0, 128);
  const room = await createRoom(title);

  for (const email of notifyEmails()) {
    try {
      await addRoomMember(room.id, email);
    } catch (err) {
      // Don't let one bad email address (typo, not a Webex user, etc.)
      // sink the whole thing — the room still exists and other invitees
      // (or the bot itself) still have it.
      console.error(`webex-pipeline: failed to add ${email} to room ${room.id}:`, err);
    }
  }

  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const link = `${appUrl}/t/${tenant.slug}/p/${proposal.id}`;

  await postMessage(
    room.id,
    [
      `**${proposal.title}**`,
      "",
      `Just crossed **${threshold}** votes in ${tenant.name} — this proposal has moved to **Trigger to Action** and is routed here for the body that can act on it.`,
      "",
      proposal.summary,
      "",
      `👥 **${proposal.votes.toLocaleString()}** total endorsements`,
      `🔗 [Open the proposal in CIN](${link})`,
    ].join("\n"),
  );

  try {
    await postCard(
      room.id,
      "Cast or change a vote from right here",
      buildBallotCard({ id: proposal.id, title: proposal.title }),
    );
  } catch (err) {
    // Non-fatal — the room and the summary message are already up.
    console.error(`webex-pipeline: failed to post ballot card to room ${room.id}:`, err);
  }

  await proposals.attachWebexRoom(tenant.slug, proposal.id, room.id);

  return {
    created: true,
    roomId: room.id,
    roomUrl: webexSpaceDeepLink(room.id),
    threshold,
    realVoteCount,
  };
}
