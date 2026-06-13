import { NextRequest, NextResponse } from "next/server";
import { apiErrorStatus } from "@/lib/utils";
import { callLlm } from "@/lib/ai/client";
import { buildDataQuerySystemPrompt, buildDataQueryUserPrompt } from "@/lib/ai/prompts/data-query";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, question, metrics } = body;

    if (!question || !metrics) {
      return NextResponse.json({ error: "缺少问题或数据" }, { status: 400 });
    }

    const messages = [
      { role: "system" as const, content: buildDataQuerySystemPrompt() },
      { role: "user" as const, content: buildDataQueryUserPrompt(question, metrics) },
    ];

    const response = await callLlm({
      messages,
      apiKey: apiKey || undefined,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(response.content);
    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("Data query error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "查询失败" },
      { status: apiErrorStatus(err) }
    );
  }
}
