import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { buildDailyDigestSystemPrompt, buildDailyDigestUserPrompt } from "@/lib/ai/prompts/daily-digest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, data } = body;

    if (!data) {
      return NextResponse.json({ error: "缺少数据" }, { status: 400 });
    }

    const messages = [
      { role: "system" as const, content: buildDailyDigestSystemPrompt() },
      { role: "user" as const, content: buildDailyDigestUserPrompt(data) },
    ];

    const response = await callLlm({
      messages,
      apiKey: apiKey || undefined,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(response.content);
    return NextResponse.json({ digest: parsed });
  } catch (err) {
    console.error("Daily digest generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成日报失败" },
      { status: 500 }
    );
  }
}
