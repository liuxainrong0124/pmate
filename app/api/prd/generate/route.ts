import { NextRequest } from "next/server";
import { callLlmStreaming } from "@/lib/ai/client";
import { PRD_SYSTEM_PROMPT, buildPrdUserPrompt, PROGRESS_STEP_ORDER, PROGRESS_MESSAGES } from "@/lib/ai/prompts/prd";
import { PrdInput, PrdProgress, PrdTemplateType } from "@/types";

const VALID_TEMPLATES: PrdTemplateType[] = ["new_feature", "optimization", "campaign"];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { featureName, description, template, context, targetUsers } = body;

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
            messages: [
              { role: "system", content: PRD_SYSTEM_PROMPT },
              { role: "user", content: buildPrdUserPrompt(prdInput) },
            ],
            temperature: 0.5,
            maxTokens: 8192,
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

        send({ type: "done", usage: response.usage });
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "PRD generation failed";
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
