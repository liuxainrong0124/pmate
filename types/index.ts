// ===== Feedback Analyzer Types =====

export type FeedbackCategory = "bug" | "feature_request" | "ux" | "support" | "other";

export interface FeedbackInsight {
  title: string;
  severity: "high" | "medium" | "low";
  count: number;
  quotes: string[];
  category: FeedbackCategory;
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

// ===== History Types =====

export interface HistoryItem {
  id: string;
  type: "feedback" | "prd";
  title: string;
  createdAt: string;
  preview: string;
}
