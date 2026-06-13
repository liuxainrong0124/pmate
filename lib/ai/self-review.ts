// AI self-critique utility — sends AI output back for review and improvement.
// This is the key to depth: AI doesn't just generate, it reflects and improves.

import { callLlm } from "./client";

export interface SelfReviewOptions {
  apiKey?: string;
  domain: string;       // e.g. "活动策划", "A/B实验分析", "产品周报"
  qualityRubric: string; // Specific quality criteria to check against
  originalPrompt: string;
  aiOutput: string;
}

export interface SelfReviewResult {
  improvedOutput: string;
  reviewNotes: string;
  score: number;        // 1-10 self-rating
  issuesFound: string[];
  improvements: string[];
}

const REVIEW_SYSTEM_PROMPT = `你是一个严格的质量审核专家。你的任务是审查AI生成的内容，找出问题并改进。

## 审查维度

### 1. 深度 (Depth)
- 是否有具体的、可量化的内容，而不是空泛的描述？
- 是否考虑了多个角度和边界情况？
- 是否有数据支撑的论点？
- 是否关联了上下文而非孤立地看问题？

### 2. 专业度 (Professionalism)
- 是否使用了领域专业术语且使用正确？
- 是否体现了对业务逻辑的深刻理解？
- 建议是否具体可行而非"正确的废话"？

### 3. 完整性 (Completeness)
- 是否覆盖了所有要求的方面？
- 是否遗漏了重要的风险、机会或约束？
- 各章节之间逻辑是否连贯？

### 4. 诚实度 (Honesty)
- 是否有编造的数据或不合理的推测？
- 不确定性是否被明确标注？
- 建议是否有依据（数据/逻辑/经验）？

## 输出格式

严格输出以下JSON：
{
  "score": 1-10的评分,
  "issuesFound": ["发现的具体问题列表"],
  "improvements": ["具体的改进措施"],
  "reviewNotes": "审查总结（200字以内）",
  "improvedOutput": "改进后的完整输出（保持原始格式）"
}

## 核心原则
- 宁可指出问题也不敷衍通过
- 对"看起来专业但实际空洞"的内容要特别敏感
- 如果原文已经很好，在保持原意的基础上锦上添花
- 改进后的内容必须比原文更长、更具体、更有深度`;

export async function selfReview(options: SelfReviewOptions): Promise<SelfReviewResult> {
  const reviewPrompt = `请审查以下${options.domain}的AI生成内容。

## 质量标准
${options.qualityRubric}

## 原始需求
${options.originalPrompt}

## AI生成的内容
${options.aiOutput}

请按审查维度逐一检查，找出问题并输出改进后的版本。`;

  try {
    const res = await callLlm({
      apiKey: options.apiKey,
      messages: [
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
        { role: "user", content: reviewPrompt },
      ],
      temperature: 0.3,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.content);
    return {
      score: parsed.score || 7,
      issuesFound: parsed.issuesFound || [],
      improvements: parsed.improvements || [],
      reviewNotes: parsed.reviewNotes || "",
      improvedOutput: parsed.improvedOutput || options.aiOutput,
    };
  } catch {
    // If review fails, return original output unchanged
    return {
      score: 6,
      issuesFound: ["自检流程失败，无法评估"],
      improvements: [],
      reviewNotes: "自检流程异常，已保留原始输出",
      improvedOutput: options.aiOutput,
    };
  }
}

/**
 * Multi-step generation helper: runs a sequence of AI calls where each step
 * builds on the previous one, then runs a final self-review.
 */
export async function multiStepGenerate(
  apiKey: string | undefined,
  steps: { label: string; systemPrompt: string; userPrompt: string; temperature?: number }[],
  reviewDomain: string,
  reviewRubric: string
): Promise<{
  steps: { label: string; output: string }[];
  finalOutput: string;
  review: SelfReviewResult;
}> {
  const stepResults: { label: string; output: string }[] = [];
  let accumulatedContext = "";

  for (const step of steps) {
    const promptWithContext = accumulatedContext
      ? `${step.userPrompt}\n\n## 前面步骤的分析结果\n${accumulatedContext}`
      : step.userPrompt;

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: step.systemPrompt },
        { role: "user", content: promptWithContext },
      ],
      temperature: step.temperature ?? 0.5,
      responseFormat: "json_object",
    });

    stepResults.push({ label: step.label, output: res.content });
    accumulatedContext += `\n### ${step.label}\n${res.content}\n`;
  }

  // Combine all step outputs
  const combinedOutput = stepResults.map(s => s.output).join("\n");
  const originalPrompt = steps.map(s => s.userPrompt).join("\n---\n");

  const review = await selfReview({
    apiKey,
    domain: reviewDomain,
    qualityRubric: reviewRubric,
    originalPrompt,
    aiOutput: combinedOutput,
  });

  return { steps: stepResults, finalOutput: review.improvedOutput, review };
}
