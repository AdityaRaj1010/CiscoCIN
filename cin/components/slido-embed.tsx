"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Vote } from "lucide-react";

/**
 * Live Slido poll, embedded via iframe right above the proposals grid —
 * "the moment you enter a tenant" per the request. Renders nothing if
 * SLIDO_EVENT_ID isn't configured (see /api/config/slido), so tenants/
 * environments that haven't set one up see no change at all.
 *
 * Uses the /polls embed path (not the full event) since this is
 * specifically meant to be a polling widget, not the whole Q&A/wall.
 * See: https://community.slido.com/live-video-embedding-250/embed-slido-into-a-website-408
 */
export function SlidoEmbed() {
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config/slido")
      .then((r) => (r.ok ? r.json() : { eventId: null }))
      .then((res) => {
        if (!cancelled) setEventId(res.eventId ?? null);
      })
      .catch(() => {
        if (!cancelled) setEventId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!eventId) return null;

  const embedUrl = `https://app.sli.do/event/${eventId}/polls`;
  const openUrl = `https://app.sli.do/event/${eventId}`;

  return (
    <div className="mb-6 overflow-hidden rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
            <Vote size={15} />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Live poll</p>
            <p className="text-[11.5px] text-ink-3">via Slido</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={openUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Open in Slido
            <ExternalLink size={12} />
          </a>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label={collapsed ? "Expand poll" : "Collapse poll"}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <iframe
          src={embedUrl}
          title="Slido poll"
          height="420"
          width="100%"
          allow="clipboard-write"
          style={{ border: 0, display: "block" }}
        />
      )}
    </div>
  );
}
