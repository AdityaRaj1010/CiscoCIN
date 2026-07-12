/**
 * lib/cisco/webex.ts
 *
 * Thin wrapper around the Webex REST API for the CIN bot.
 *
 * Two directions live here:
 *   - Inbound (messages/attachmentActions): a member types `propose:` in a
 *     Webex space the bot is already in, or taps a ballot card. This is
 *     the original design from cin-build-spec.md §7.
 *   - Outbound (rooms/memberships) — the primary path now: a vote cast in
 *     the CIN web app crosses a threshold, and CIN creates a brand-new
 *     Webex space for that proposal and adds a real person to it. See
 *     lib/cisco/webex-pipeline.ts and WEBEX_INTEGRATION.md.
 *
 * Notes from the field (see cin-build-spec.md §7) that this file exists to
 * encode so nobody has to relearn them by trial and error:
 *
 *   1. Webhook payloads never contain the message/card body — only ids.
 *      You must GET /v1/messages/{id} or /v1/attachment/actions/{id} with
 *      the bot token to read the actual content.
 *   2. The bot hears its own messages. Every event must be checked against
 *      WEBEX_BOT_PERSON_ID and dropped, or you get an infinite loop.
 *   3. In a group space the bot only receives messages that @mention it —
 *      the demo command is `@CIN propose: <title> — <body>`.
 *   4. Two webhook subscriptions point at the same route: resource
 *      `messages` (event `created`) and resource `attachmentActions`
 *      (event `created`). This file branches on `resource`.
 *
 * All calls use WEBEX_BOT_TOKEN. Nothing here invents or guesses a token,
 * org id, or URL — if an env var is missing, calls fail loudly.
 */

import crypto from "node:crypto";

const WEBEX_API = "https://webexapis.com/v1";

function botToken(): string {
  const token = process.env.WEBEX_BOT_TOKEN;
  if (!token) throw new Error("WEBEX_BOT_TOKEN is not configured");
  return token;
}

/* --------------------------- signature verification --------------------------- */

/**
 * Verify the `X-Spark-Signature` header: HMAC-SHA1 of the RAW request body
 * using WEBEX_WEBHOOK_SECRET. Call this on the raw text body, before you
 * JSON.parse it.
 */
export function verifyWebexSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WEBEX_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: if the secret isn't configured we cannot trust the request.
    console.error("WEBEX_WEBHOOK_SECRET is not configured — rejecting webhook");
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto.createHmac("sha1", secret).update(rawBody, "utf8").digest("hex");

  // Constant-time compare, same length required first.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** True if this event was authored by the bot itself — always drop these. */
export function isFromBot(personId: string | undefined | null): boolean {
  const botId = process.env.WEBEX_BOT_PERSON_ID;
  return !!botId && !!personId && personId === botId;
}

/* --------------------------------- webhook payload types --------------------------------- */

export interface WebexMessageEvent {
  resource: "messages";
  event: "created";
  data: {
    id: string;
    roomId: string;
    roomType?: string;
    personId: string;
    personEmail?: string;
  };
}

export interface WebexAttachmentActionEvent {
  resource: "attachmentActions";
  event: "created";
  data: {
    id: string;
    roomId: string;
    personId: string;
    personEmail?: string;
  };
}

export type WebexWebhookEvent = WebexMessageEvent | WebexAttachmentActionEvent;

export interface WebexMessage {
  id: string;
  roomId: string;
  text?: string;
  markdown?: string;
  personId: string;
  personEmail?: string;
}

export interface WebexAttachmentAction {
  id: string;
  type: string;
  messageId: string;
  roomId: string;
  personId: string;
  inputs: Record<string, string>;
}

/* --------------------------------- API calls --------------------------------- */

async function webexFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${WEBEX_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${botToken()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Webex API ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

/** GET /v1/messages/{id} — the webhook never gives you the text itself. */
export async function getMessage(id: string): Promise<WebexMessage> {
  return webexFetch(`/messages/${id}`);
}

/* --------------------------------- rooms (spaces) --------------------------------- */

export interface WebexRoom {
  id: string;
  title: string;
  type: string;
  isLocked?: boolean;
  created?: string;
}

export interface WebexMembership {
  id: string;
  roomId: string;
  personEmail?: string;
  isModerator?: boolean;
}

/**
 * POST /v1/rooms — creates a Webex space. The token's own identity (the
 * bot) is added automatically; nobody else can see it until they're added
 * via the Memberships API below. This is the "create a Webex room" side of
 * the vote-threshold integration.
 */
export async function createRoom(title: string): Promise<WebexRoom> {
  return webexFetch(`/rooms`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

/**
 * POST /v1/memberships — adds a person (by email) to a room, so it shows
 * up in *their* Webex account, not just the bot's. This is what makes the
 * auto-created room actually visible to a human instead of just existing
 * on the bot's side. Pass `isModerator: true` to let them manage the space.
 */
export async function addRoomMember(
  roomId: string,
  personEmail: string,
  isModerator = false,
): Promise<WebexMembership> {
  return webexFetch(`/memberships`, {
    method: "POST",
    body: JSON.stringify({ roomId, personEmail, isModerator }),
  });
}

/**
 * Webex room ids are base64 of `ciscospark://us/ROOM/<uuid>`. There is no
 * documented web URL for a space (confirmed on the Webex developer
 * community — "Create valid space links"), but decoding the id and
 * rebuilding it as a `webexteams://` deep link is the supported way to
 * hand a member already-in-the-room a clickable "open this space" link
 * that the desktop/mobile app understands. Returns null if the id doesn't
 * decode to the expected shape (e.g. a non-Webex string in tests).
 */
export function webexSpaceDeepLink(roomId: string): string | null {
  try {
    const decoded = Buffer.from(roomId, "base64").toString("utf8");
    const match = decoded.match(/ROOM\/([a-f0-9-]+)/i);
    if (!match) return null;
    return `webexteams://im?space=${match[1]}`;
  } catch {
    return null;
  }
}

/** GET /v1/attachment/actions/{id} — resolves the `inputs` a user submitted on a card. */
export async function getAttachmentAction(id: string): Promise<WebexAttachmentAction> {
  return webexFetch(`/attachment/actions/${id}`);
}

/** POST /v1/messages — plain text or markdown reply into a room. */
export async function postMessage(roomId: string, markdown: string) {
  return webexFetch(`/messages`, {
    method: "POST",
    body: JSON.stringify({ roomId, markdown }),
  });
}

/** POST /v1/messages with an Adaptive Card attachment. */
export async function postCard(roomId: string, text: string, card: unknown) {
  return webexFetch(`/messages`, {
    method: "POST",
    body: JSON.stringify({
      roomId,
      text,
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: card,
        },
      ],
    }),
  });
}

/* --------------------------------- command parsing --------------------------------- */

/**
 * In a group space Webex only forwards messages that @mention the bot, and
 * `message.text` still includes the mention text (e.g. "CIN propose: ...").
 * Strip a leading mention token, then look for `propose:`.
 */
export function parseProposeCommand(rawText: string): { title: string; body: string } | null {
  const text = rawText.trim();
  const match = text.match(/propose\s*:\s*(.+)/is);
  if (!match) return null;

  const rest = match[1].trim();
  // "<title> — <body>" or "<title> - <body>"; body is optional.
  const parts = rest.split(/\s+[—–-]\s+/);
  const title = parts[0]?.trim();
  const body = parts.slice(1).join(" — ").trim();
  if (!title) return null;

  return { title, body: body || title };
}

/* --------------------------------- adaptive card ballot --------------------------------- */

export function buildBallotCard(proposal: { id: string; title: string }) {
  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.3",
    body: [
      {
        type: "TextBlock",
        text: "New proposal — cast your vote",
        weight: "bolder",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: proposal.title,
        wrap: true,
        size: "medium",
      },
    ],
    actions: [
      {
        type: "Action.Submit",
        title: "✅ Approve",
        data: { proposalId: proposal.id, choice: "approve" },
      },
      {
        type: "Action.Submit",
        title: "❌ Object",
        data: { proposalId: proposal.id, choice: "object" },
      },
    ],
  };
}
