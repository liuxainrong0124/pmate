import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { multiStepGenerate } from "@/lib/ai/self-review";
import {
  ACTIVITY_STEP_SYSTEM_PROMPTS,
  ACTIVITY_QUALITY_RUBRIC,
  buildActivityUserPrompt,
  buildActivityHistoricalContext,
} from "@/lib/ai/prompts/activity";

const SYNTHESIS_SYSTEM_PROMPT = `你是一个资深活动运营策略师。前面已经完成了4步深度分析（目标分析→机制设计→排期预算→风险文案），现在请将所有分析结果综合为一份完整的活动策划方案。

输出JSON：
{
  "plan": {
    "name": "活动名称（有吸引力、体现活动核心）",
    "theme": "活动主题slogan",
    "mechanics": "核心玩法规则详述（让开发看完就能实现）",
    "timeline": [
      { "phase": "阶段名", "dateRange": "日期范围", "actions": ["具体行动"] }
    ],
    "budgetBreakdown": [
      { "item": "费用项", "cost": 金额数字, "note": "计算说明" }
    ],
    "risks": [
      { "risk": "风险描述", "probability": "高|中|低", "impact": "具体影响", "mitigation": "应对措施" }
    ],
    "expectedMetrics": {
      "participants": "预期参与人数（含计算依据）",
      "conversionRate": "预期转化率（含计算依据）",
      "roi": "预期ROI（含计算依据）"
    },
    "copySuggestions": [
      { "channel": "渠道", "title": "标题", "body": "正文" }
    ],
    "channels": ["适配的推广渠道"],
    "targetAudience": "目标用户描述"
  }
}

要求：
1. 综合前面4步的分析结论，不要遗漏重要发现
2. 所有数字必须基于前面分析的计算逻辑，不能凭空编造
3. 风险必须是前面风险分析中识别出的具体风险
4. 文案要适配不同渠道特点
5. 方案整体要自洽、可执行`;

export async function POST(request: NextRequest) {
  try {
    const { goal, targetAudience, budget, channels, duration, apiKey, historicalContext } = await request.json();
    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }

    const goalStr = goal.trim();
    const audience = targetAudience || "全量用户";
    const budgetStr = budget || "未指定";
    const channelsStr = channels || "Push、站内信、短信、公众号";
    const durationStr = duration || "7天";

    const basePrompt = buildActivityUserPrompt(goalStr, audience, budgetStr, channelsStr, durationStr, historicalContext);

    // ── Phase 1: 4-step deep reasoning chain ──
    const result = await multiStepGenerate(
      apiKey,
      [
        {
          label: "目标分析",
          systemPrompt: ACTIVITY_STEP_SYSTEM_PROMPTS.goalAnalysis,
          userPrompt: `${basePrompt}\n\n请执行第一步：深度分析活动目标。`,
          temperature: 0.5,
        },
        {
          label: "机制设计",
          systemPrompt: ACTIVITY_STEP_SYSTEM_PROMPTS.mechanicsDesign,
          userPrompt: `${basePrompt}\n\n请基于前面目标分析的结论，设计活动机制。`,
          temperature: 0.6,
        },
        {
          label: "排期预算",
          systemPrompt: ACTIVITY_STEP_SYSTEM_PROMPTS.timelineAndBudget,
          userPrompt: `${basePrompt}\n\n请基于前面的目标和机制，制定详细排期和预算。`,
          temperature: 0.4,
        },
        {
          label: "风险预案与文案",
          systemPrompt: ACTIVITY_STEP_SYSTEM_PROMPTS.riskAndCopy,
          userPrompt: `${basePrompt}\n\n请基于前面所有分析，制定风险预案和推广文案。`,
          temperature: 0.5,
        },
      ],
      "活动策划",
      ACTIVITY_QUALITY_RUBRIC
    );

    // ── Phase 2: Synthesis into final plan format ──
    const contextForSynthesis = result.steps
      .map(s => `### ${s.label}\n${s.output}`)
      .join("\n\n---\n\n");

    const synthesisRes = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: SYNTHESIS_SYSTEM_PROMPT },
        {
          role: "user",
          content: `## 活动基本信息\n${basePrompt}\n\n## 4步分析结果\n${contextForSynthesis}\n\n## 自审意见\n评分：${result.review.score}/10\n发现的问题：${result.review.issuesFound.join("；")}\n改进建议：${result.review.improvements.join("；")}\n\n请综合以上所有分析，输出最终的活动策划方案JSON。`,
        },
      ],
      temperature: 0.4,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(synthesisRes.content);
    const plan = parsed.plan || null;

    return NextResponse.json({
      plan,
      usage: synthesisRes.usage,
      reasoning: {
        steps: result.steps.map(s => s.label),
        reviewScore: result.review.score,
        reviewNotes: result.review.reviewNotes,
        issuesFound: result.review.issuesFound,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Activity plan generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
