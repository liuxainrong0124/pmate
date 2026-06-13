import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { apiErrorStatus } from "@/lib/utils";
import { buildReviewSystemPrompt, buildReviewUserPrompt } from "@/lib/ai/prompts/requirement-review";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, requirement } = body;

    if (!requirement?.title) {
      return NextResponse.json({ error: "缺少需求信息" }, { status: 400 });
    }

    const messages = [
      { role: "system" as const, content: buildReviewSystemPrompt() },
      { role: "user" as const, content: buildReviewUserPrompt(requirement) },
    ];

    const response = await callLlm({
      messages,
      apiKey: apiKey || undefined,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(response.content);
    return NextResponse.json({ review: parsed });
  } catch (err) {
    console.error("Requirement review error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "评审失败" },
      { status: apiErrorStatus(err) }
    );
  }
}
