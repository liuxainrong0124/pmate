import { NextRequest } from "next/server";
import { callLlmStreaming } from "@/lib/ai/client";
import { selfReview } from "@/lib/ai/self-review";
import { PRD_SYSTEM_PROMPT, buildPrdUserPrompt, PROGRESS_STEP_ORDER, PROGRESS_MESSAGES } from "@/lib/ai/prompts/prd";
import { PrdInput, PrdProgress, PrdTemplateType } from "@/types";

const VALID_TEMPLATES: PrdTemplateType[] = ["new_feature", "optimization", "campaign"];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { featureName, description, template, context, targetUsers, apiKey } = body;

  if (!featureName || !description || !template) {
    return new Response(
      JSON.stringify({ error: "featureName, description, and template are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!VALID_TEMPLATES.includes(template)) {
    return new Response(
      JSON.stringify({
        error: `template must be one of: ${VALID_TEMPLATES.join(", ")}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const prdInput: PrdInput = {
    featureName,
    description,
    template,
    context: context || "",
    targetUsers: targetUsers || "",
  };

  const encoder = new TextEncoder();
  let stepIndex = 0;
  let accumulatedText = "";
  let lastMarkerIndex = 0;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const response = await callLlmStreaming(
          {
            apiKey: apiKey || undefined,
            messages: [
              { role: "system", content: PRD_SYSTEM_PROMPT },
              { role: "user", content: buildPrdUserPrompt(prdInput) },
            ],
            temperature: 0.5,
          },
          (chunk) => {
            accumulatedText += chunk;

            const markerCount = (accumulatedText.match(/---PROGRESS---/g) || []).length;
            if (markerCount > lastMarkerIndex && stepIndex < PROGRESS_STEP_ORDER.length) {
              lastMarkerIndex = markerCount;
              const step = PROGRESS_STEP_ORDER[stepIndex];
              stepIndex++;
              const progress: PrdProgress = {
                step,
                message: PROGRESS_MESSAGES[step],
              };
              send({ type: "progress", progress });
            }

            send({ type: "chunk", content: chunk });
          }
        );

        // Phase 2: Real self-review (separate LLM call)
        try {
          const reviewResult = await selfReview({
            apiKey: apiKey || undefined,
            domain: "产品需求文档（PRD）",
            qualityRubric: `## PRD质量标准
- 所有数字必须有计算逻辑，不能凭空出现
- 用户故事必须有明确的验收条件
- 功能详述必须覆盖正常流程、边界条件、异常处理
- 验收标准必须可测试、可量化（GWT格式）
- 不能有"显著提升"、"体验良好"等主观模糊表述
- 风险与依赖必须具体，有回滚方案`,
            originalPrompt: buildPrdUserPrompt(prdInput),
            aiOutput: accumulatedText,
          });
          send({ type: "review", review: reviewResult });
        } catch {
          // If review fails, send done anyway
        }

        send({ type: "done", usage: response.usage });
        controller.close();
      } catch (error: unknown) {
        const isAuth = error instanceof Error && (
          error.message.toLowerCase().includes("401") || error.message.toLowerCase().includes("authentication") || error.message.toLowerCase().includes("api key")
        );
        const message = isAuth
          ? "API Key 无效，请在设置中重新配置 DeepSeek API Key"
          : error instanceof Error ? error.message : "PRD generation failed";
        send({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
