/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CompetitorReport, CompetitorProfile, ComparisonItem, SWOTItem, ActionItem, TimelinePhase,
  RecentUpdate, SwotStrength, SwotWeakness, SwotOpportunity, SwotThreat,
  PricingAnalysis, Differentiation, PredictedMove,
} from "@/types";
import { toStringArray } from "./utils";

const VALID_ASSESSMENTS = ["advantage", "disadvantage", "parity"];
const VALID_SWOT_TYPES = ["strength", "weakness", "opportunity", "threat"];
const VALID_EFFORTS = ["low", "medium", "high"];
const VALID_PHASES = ["短期(1个月)", "中期(3个月)", "长期(6个月)"];

export type ParsedCompetitorReport = CompetitorReport;

function parseRecentUpdates(arr: any): RecentUpdate[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((u: any) => ({
    update: String(u.update || u.item || ""),
    date: String(u.date || ""),
    significance: String(u.significance || ""),
    strategicIntent: String(u.strategicIntent || ""),
  }));
}

function parseSwotStrengths(arr: any): SwotStrength[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((s: any) => ({
    item: String(s.item || s.title || s || ""),
    evidence: String(s.evidence || ""),
    defensibility: String(s.defensibility || ""),
  }));
}

function parseSwotWeaknesses(arr: any): SwotWeakness[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((s: any) => ({
    item: String(s.item || s.title || s || ""),
    evidence: String(s.evidence || ""),
    exploitability: String(s.exploitability || ""),
  }));
}

function parseSwotOpportunities(arr: any): SwotOpportunity[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((s: any) => ({
    item: String(s.item || s.title || s || ""),
    timeWindow: String(s.timeWindow || ""),
    effortRequired: String(s.effortRequired || ""),
  }));
}

function parseSwotThreats(arr: any): SwotThreat[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((s: any) => ({
    item: String(s.item || s.title || s || ""),
    urgency: String(s.urgency || ""),
    ourDefense: String(s.ourDefense || ""),
  }));
}

function parsePricingAnalysis(obj: any): PricingAnalysis | null {
  if (!obj || typeof obj !== "object") return null;
  return {
    competitorPricing: String(obj.competitorPricing || obj || ""),
    ourPricing: String(obj.ourPricing || ""),
    pricingGap: String(obj.pricingGap || ""),
    recommendation: String(obj.recommendation || ""),
  };
}

function parseDifferentiation(obj: any): Differentiation | null {
  if (!obj || typeof obj !== "object") return null;
  return {
    current: String(obj.current || obj || ""),
    opportunity: String(obj.opportunity || ""),
    recommendedPositioning: String(obj.recommendedPositioning || ""),
  };
}

function parsePredictedMoves(arr: any): PredictedMove[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((m: any) => ({
    move: String(m.move || m.item || m || ""),
    probability: String(m.probability || ""),
    timing: String(m.timing || ""),
    ourResponse: String(m.ourResponse || ""),
  }));
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

  const company = parsed.company && typeof parsed.company === "object" ? {
    name: String(parsed.company.name || ""),
    founded: String(parsed.company.founded || ""),
    positioning: String(parsed.company.positioning || ""),
    targetUsers: String(parsed.company.targetUsers || ""),
    businessModel: String(parsed.company.businessModel || ""),
    coreFeatures: toStringArray(parsed.company.coreFeatures),
    recentUpdates: parseRecentUpdates(parsed.company.recentUpdates),
  } : undefined;

  const swot = parsed.swot && typeof parsed.swot === "object" ? {
    strengths: parseSwotStrengths(parsed.swot.strengths),
    weaknesses: parseSwotWeaknesses(parsed.swot.weaknesses),
    opportunities: parseSwotOpportunities(parsed.swot.opportunities),
    threats: parseSwotThreats(parsed.swot.threats),
  } : undefined;

  const comparison = parsed.comparison && typeof parsed.comparison === "object" ? {
    dimensions: toStringArray(parsed.comparison.dimensions),
    yourScore: Array.isArray(parsed.comparison.yourScore) ? parsed.comparison.yourScore.map(Number) : [],
    competitorScore: Array.isArray(parsed.comparison.competitorScore) ? parsed.comparison.competitorScore.map(Number) : [],
  } : undefined;

  const impact = parsed.impact && typeof parsed.impact === "object" ? {
    userChurnRisk: String(parsed.impact.userChurnRisk || "中"),
    gapAnalysis: String(parsed.impact.gapAnalysis || ""),
    suggestions: toStringArray(parsed.impact.suggestions),
  } : undefined;

  const competitorProfiles: CompetitorProfile[] = Array.isArray(parsed.competitorProfiles)
    ? parsed.competitorProfiles.map((p: any): CompetitorProfile => ({
        name: String(p.name || ""),
        overview: String(p.overview || ""),
        keyFeatures: toStringArray(p.keyFeatures),
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
        actions: toStringArray(t.actions),
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
    pricingAnalysis: parsePricingAnalysis(parsed.pricingAnalysis),
    differentiation: parseDifferentiation(parsed.differentiation),
    predictedMoves: parsePredictedMoves(parsed.predictedMoves),
    opportunities: toStringArray(parsed.opportunities),
    threats: toStringArray(parsed.threats),
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
