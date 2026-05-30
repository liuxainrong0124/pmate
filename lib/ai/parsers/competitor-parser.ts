/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompetitorReport, CompetitorProfile, ComparisonItem, SWOTItem, ActionItem, TimelinePhase } from "@/types";

const VALID_ASSESSMENTS = ["advantage", "disadvantage", "parity"];
const VALID_SWOT_TYPES = ["strength", "weakness", "opportunity", "threat"];
const VALID_EFFORTS = ["low", "medium", "high"];
const VALID_PHASES = ["短期(1个月)", "中期(3个月)", "长期(6个月)"];

export function parseCompetitorResponse(rawJson: string): CompetitorReport {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    const match = rawJson.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response contained no valid JSON");
    }
    parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    parsed = {};
  }

  const competitorProfiles: CompetitorProfile[] = Array.isArray(parsed.competitorProfiles)
    ? parsed.competitorProfiles.map((p: any): CompetitorProfile => ({
        name: String(p.name || ""),
        overview: String(p.overview || ""),
        keyFeatures: Array.isArray(p.keyFeatures) ? p.keyFeatures.map(String) : [],
        targetUsers: String(p.targetUsers || ""),
        recentUpdates: String(p.recentUpdates || ""),
        strengthSummary: String(p.strengthSummary || ""),
        weaknessSummary: String(p.weaknessSummary || ""),
      }))
    : [];

  const featureComparison: ComparisonItem[] = Array.isArray(parsed.featureComparison)
    ? parsed.featureComparison.map((c: any): ComparisonItem => ({
        dimension: String(c.dimension || ""),
        ourPosition: String(c.ourPosition || ""),
        competitorPosition: String(c.competitorPosition || ""),
        assessment: VALID_ASSESSMENTS.includes(c.assessment) ? c.assessment : "parity",
        gap: String(c.gap || ""),
      }))
    : [];

  const strengthsWeaknesses: SWOTItem[] = Array.isArray(parsed.strengthsWeaknesses)
    ? parsed.strengthsWeaknesses.map((s: any): SWOTItem => ({
        type: VALID_SWOT_TYPES.includes(s.type) ? s.type : "strength",
        title: String(s.title || ""),
        description: String(s.description || ""),
        relatedCompetitor: String(s.relatedCompetitor || ""),
      }))
    : [];

  const timeline: TimelinePhase[] = Array.isArray(parsed.timeline)
    ? parsed.timeline.map((t: any): TimelinePhase => ({
        phase: VALID_PHASES.includes(t.phase) ? t.phase : "短期(1个月)",
        actions: Array.isArray(t.actions) ? t.actions.map(String) : [],
        goal: String(t.goal || ""),
      }))
    : [];

  return {
    summary: String(parsed.summary || ""),
    competitorProfiles,
    featureComparison,
    strengthsWeaknesses,
    pricingAnalysis: String(parsed.pricingAnalysis || ""),
    differentiation: String(parsed.differentiation || ""),
    predictedMoves: String(parsed.predictedMoves || ""),
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.map(String) : [],
    threats: Array.isArray(parsed.threats) ? parsed.threats.map(String) : [],
    timeline,
    actionItems: Array.isArray(parsed.actionItems)
      ? parsed.actionItems.map((a: any): ActionItem => ({
          what: String(a.what || ""),
          why: String(a.why || ""),
          effort: VALID_EFFORTS.includes(a.effort) ? a.effort : "medium",
        }))
      : [],
  };
}
