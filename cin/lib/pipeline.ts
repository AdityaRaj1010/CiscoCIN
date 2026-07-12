/**
 * Every proposal moves through CIN's 4-stage trust pipeline. The stage is
 * part of the proposal record; the detail view renders it as an OS status strip
 * and the feed shows it as a compact chip.
 */
export type StageId = "notice" | "trust" | "trigger" | "verification";

export interface PipelineStage {
  id: StageId;
  label: string;
  blurb: string;
}

export const PIPELINE: PipelineStage[] = [
  {
    id: "notice",
    label: "Notice & Input",
    blurb: "Raised and open for the community to weigh in.",
  },
  {
    id: "trust",
    label: "Trust Filter",
    blurb: "Verified members endorse; duplicates and noise are filtered.",
  },
  {
    id: "trigger",
    label: "Trigger to Action",
    blurb: "Threshold met — routed to the body that can act.",
  },
  {
    id: "verification",
    label: "Verification",
    blurb: "Outcome recorded and verified on the transparency ledger.",
  },
];

export const STAGE_INDEX: Record<StageId, number> = {
  notice: 0,
  trust: 1,
  trigger: 2,
  verification: 3,
};

export const STAGE_BY_ID: Record<StageId, PipelineStage> = Object.fromEntries(
  PIPELINE.map((s) => [s.id, s]),
) as Record<StageId, PipelineStage>;
