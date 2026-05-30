/* eslint-disable @typescript-eslint/no-explicit-any */

export interface AnomalyScenario {
  category: string;
  title: string;
  description: string;
  trigger: string;
  severity: "critical" | "high" | "medium" | "low";
  suggestion: string;
}

const VALID_CATEGORIES = ["网络异常", "权限异常", "数据为空", "并发冲突", "版本兼容", "边界条件"];
const VALID_SEVERITIES = ["critical", "high", "medium", "low"];

export function parseAnomalyResponse(rawJson: string): AnomalyScenario[] {
  let parsed: any;
  try { parsed = JSON.parse(rawJson); } catch {
    const m = rawJson.match(/\{[\s\S]*\}/);
    if (!m) return [];
    parsed = JSON.parse(m[0]);
  }
  if (!parsed || !Array.isArray(parsed.scenarios)) return [];
  return parsed.scenarios.map((s: any): AnomalyScenario => ({
    category: VALID_CATEGORIES.includes(s.category) ? s.category : "边界条件",
    title: String(s.title || ""),
    description: String(s.description || ""),
    trigger: String(s.trigger || ""),
    severity: VALID_SEVERITIES.includes(s.severity) ? s.severity : "medium",
    suggestion: String(s.suggestion || ""),
  }));
}
