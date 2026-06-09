/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CompetitorReport, CompetitorProfile, ComparisonItem, SWOTItem, ActionItem, TimelinePhase,
} from "@/types";

const VALID_ASSESSMENTS = ["advantage", "disadvantage", "parity"];
const VALID_SWOT_TYPES = ["strength", "weakness", "opportunity", "threat"];
const VALID_EFFORTS = ["low", "medium", "high"];
const VALID_PHASES = ["短期(1个月)", "中期(3个月)", "长期(6个月)"];

export interface ParsedCompetitorReport extends CompetitorReport {
  company?: {
    name: string;
    founded: string;
    positioning: string;
    targetUsers: string;
    businessModel: string;
    coreFeatures: string[];
    recentUpdates: string[];
  };
  swot?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  comparison?: {
    dimensions: string[];
    yourScore: number[];
    competitorScore: number[];
  };
  impact?: {
    userChurnRisk: string;
    gapAnalysis: string;
    suggestions: string[];
  };
}

export function parseCompetitorResponse(rawJson: string): ParsedCompetitorReport {
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    const match = rawJson.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI response contained no valid JSON");
    parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {};

  // New fields
  const company = parsed.company && typeof parsed.company === "object" ? {
    name: String(parsed.company.name || ""),
    founded: String(parsed.company.founded || ""),
    positioning: String(parsed.company.positioning || ""),
    targetUsers: String(parsed.company.targetUsers || ""),
    businessModel: String(parsed.company.businessModel || ""),
    coreFeatures: Array.isArray(parsed.company.coreFeatures) ? parsed.company.coreFeatures.map(String) : [],
    recentUpdates: Array.isArray(parsed.company.recentUpdates) ? parsed.company.recentUpdates.map(String) : [],
  } : undefined;

  const swot = parsed.swot && typeof parsed.swot === "object" ? {
    strengths: Array.isArray(parsed.swot.strengths) ? parsed.swot.strengths.map(String) : [],
    weaknesses: Array.isArray(parsed.swot.weaknesses) ? parsed.swot.weaknesses.map(String) : [],
    opportunities: Array.isArray(parsed.swot.opportunities) ? parsed.swot.opportunities.map(String) : [],
    threats: Array.isArray(parsed.swot.threats) ? parsed.swot.threats.map(String) : [],
  } : undefined;

  const comparison = parsed.comparison && typeof parsed.comparison === "object" ? {
    dimensions: Array.isArray(parsed.comparison.dimensions) ? parsed.comparison.dimensions.map(String) : [],
    yourScore: Array.isArray(parsed.comparison.yourScore) ? parsed.comparison.yourScore.map(Number) : [],
    competitorScore: Array.isArray(parsed.comparison.competitorScore) ? parsed.comparison.competitorScore.map(Number) : [],
  } : undefined;

  const impact = parsed.impact && typeof parsed.impact === "object" ? {
    userChurnRisk: String(parsed.impact.userChurnRisk || "中"),
    gapAnalysis: String(parsed.impact.gapAnalysis || ""),
    suggestions: Array.isArray(parsed.impact.suggestions) ? parsed.impact.suggestions.map(String) : [],
  } : undefined;

  // Existing fields
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
    company,
    swot,
    comparison,
    impact,
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
