/* eslint-disable @typescript-eslint/no-explicit-any */
import { FeedbackReport, FeedbackInsight, ActionItem, FeedbackCategory, SentimentTrend } from "@/types";

const VALID_CATEGORIES: FeedbackCategory[] = ["bug", "feature_request", "ux", "support", "other"];
const VALID_SEVERITIES = ["high", "medium", "low"];
const VALID_EFFORTS = ["low", "medium", "high"];
const VALID_TRENDS: SentimentTrend[] = ["rising", "stable", "declining"];

export function parseFeedbackResponse(rawJson: string): FeedbackReport {
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

  const insights: FeedbackInsight[] = Array.isArray(parsed.insights)
    ? parsed.insights.map((i: any): FeedbackInsight => ({
        title: String(i.title || ""),
        severity: VALID_SEVERITIES.includes(i.severity) ? i.severity : "medium",
        count: Number(i.count) || 0,
        quotes: Array.isArray(i.quotes) ? i.quotes.map(String) : [],
        category: VALID_CATEGORIES.includes(i.category)
          ? i.category
          : "other",
        rootCause: String(i.rootCause || ""),
        sentimentTrend: VALID_TRENDS.includes(i.sentimentTrend) ? i.sentimentTrend : "stable",
        impactScore: Math.min(10, Math.max(1, Number(i.impactScore) || 5)),
      }))
    : [];

  const totalFeedbackCount = insights.reduce(
    (sum, i) => sum + i.count,
    0,
  );

  return {
    summary: String(parsed.summary || ""),
    categories: (parsed.categories || []).filter((c: string) =>
      VALID_CATEGORIES.includes(c as FeedbackCategory)
    ),
    insights,
    actionItems: (parsed.action_items || []).map((a: any): ActionItem => ({
      what: String(a.what || ""),
      why: String(a.why || ""),
      effort: VALID_EFFORTS.includes(a.effort) ? a.effort : "medium",
    })),
    totalFeedbackCount,
  };
}
