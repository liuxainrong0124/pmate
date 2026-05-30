// ===== Feedback Analyzer Types =====

export type FeedbackCategory = "bug" | "feature_request" | "ux" | "support" | "other";
export type SentimentTrend = "rising" | "stable" | "declining";

export interface FeedbackInsight {
  title: string;
  severity: "high" | "medium" | "low";
  count: number;
  quotes: string[];
  category: FeedbackCategory;
  rootCause: string;
  sentimentTrend: SentimentTrend;
  impactScore: number;
}

export interface ActionItem {
  what: string;
  why: string;
  effort: "low" | "medium" | "high";
}

export interface FeedbackReport {
  summary: string;
  categories: FeedbackCategory[];
  insights: FeedbackInsight[];
  actionItems: ActionItem[];
  totalFeedbackCount: number;
}

// ===== PRD Assistant Types =====

export type PrdTemplateType = "new_feature" | "optimization" | "campaign";

export interface PrdInput {
  featureName: string;
  description: string;
  template: PrdTemplateType;
  context?: string;
  targetUsers?: string;
}

export interface PrdSection {
  title: string;
  content: string;
}

export interface PrdOutput {
  sections: PrdSection[];
  fullMarkdown: string;
  suggestions: string[];
}

export type PrdProgressStep =
  | "analyzing"
  | "user_stories"
  | "functional_spec"
  | "analytics"
  | "acceptance_criteria"
  | "review";

export interface PrdProgress {
  step: PrdProgressStep;
  message: string;
}

// ===== Competitor Tracking Types =====

export interface CompetitorProfile {
  name: string;
  overview: string;
  keyFeatures: string[];
  targetUsers: string;
  recentUpdates: string;
  strengthSummary: string;
  weaknessSummary: string;
}

export interface ComparisonItem {
  dimension: string;
  ourPosition: string;
  competitorPosition: string;
  assessment: "advantage" | "disadvantage" | "parity";
  gap: string;
}

export interface SWOTItem {
  type: "strength" | "weakness" | "opportunity" | "threat";
  title: string;
  description: string;
  relatedCompetitor: string;
}

export interface TimelinePhase {
  phase: "短期(1个月)" | "中期(3个月)" | "长期(6个月)";
  actions: string[];
  goal: string;
}

export interface CompetitorReport {
  summary: string;
  competitorProfiles: CompetitorProfile[];
  featureComparison: ComparisonItem[];
  strengthsWeaknesses: SWOTItem[];
  pricingAnalysis: string;
  differentiation: string;
  predictedMoves: string;
  opportunities: string[];
  threats: string[];
  timeline: TimelinePhase[];
  actionItems: ActionItem[];
}

// ===== History Types =====

export interface HistoryItem {
  id: string;
  type: "feedback" | "prd";
  title: string;
  createdAt: string;
  preview: string;
}
