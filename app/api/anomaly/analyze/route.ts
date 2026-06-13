import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { apiErrorStatus } from "@/lib/utils";
import { toStringArray } from "@/lib/ai/parsers/utils";

const SYSTEM_PROMPT = `你是一位资深数据分析师，专门做指标异动归因分析。

## 分析要求
对于给定的指标异动，分析可能的根本原因，并按置信度排序。
考虑以下维度：产品变更、市场环境、用户行为变化、技术问题、季节性因素、竞品动作。

## 输出格式
严格按以下JSON输出：
{
  "summary": "一句话总结",
  "rootCauses": [
    {
      "cause": "原因描述",
      "confidence": 0.85,
      "evidence": "支撑证据",
      "category": "产品变更" | "市场环境" | "用户行为" | "技术问题" | "季节性" | "竞品"
    }
  ],
  "correlatedMetrics": ["关联指标1", "关联指标2"],
  "impact": {
    "severity": "高" | "中" | "低",
    "affectedSegments": ["受影响的用户群1"],
    "trendPrediction": "趋势预判"
  },
  "actions": [
    { "action": "具体行动", "effort": "low" | "medium" | "high", "expectedImpact": "预期效果" }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { metric, change, date, apiKey } = await request.json();
    if (!metric) {
      return NextResponse.json({ error: "metric is required" }, { status: 400 });
    }

    const userPrompt = `请分析以下指标异动：
- 指标：${metric}
- 变化：${change || "未知"}
- 日期：${date || "最近"}
- 请给出至少3个可能原因（按置信度排序），关联指标，影响评估，以及具体行动建议。`;

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      responseFormat: "json_object",
    });

    let parsed;
    try {
      parsed = JSON.parse(res.content);
    } catch {
      const m = res.content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI response invalid");
      parsed = JSON.parse(m[0]);
    }

    return NextResponse.json({
      analysis: {
        summary: String(parsed.summary || ""),
        rootCauses: Array.isArray(parsed.rootCauses) ? parsed.rootCauses.slice(0, 5).map((r: Record<string, unknown>) => ({
          cause: String(r.cause || ""),
          confidence: Number(r.confidence) || 0.5,
          evidence: String(r.evidence || ""),
          category: String(r.category || "未知"),
        })) : [],
        correlatedMetrics: toStringArray(parsed.correlatedMetrics),
        impact: {
          severity: ["高","中","低"].includes(String(parsed.impact?.severity)) ? String(parsed.impact.severity) : "中",
          affectedSegments: toStringArray(parsed.impact?.affectedSegments),
          trendPrediction: String(parsed.impact?.trendPrediction || ""),
        },
        actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 5).map((a: Record<string, unknown>) => ({
          action: String(a.action || ""),
          effort: ["low","medium","high"].includes(String(a.effort)) ? String(a.effort) : "medium",
          expectedImpact: String(a.expectedImpact || ""),
        })) : [],
      },
      usage: res.usage,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: apiErrorStatus(e) }
    );
  }
}
