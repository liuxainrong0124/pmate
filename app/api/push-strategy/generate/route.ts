import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { PUSH_STRATEGY_SYSTEM_PROMPT, buildPushStrategyUserPrompt } from "@/lib/ai/prompts/push-strategy";

export async function POST(request: NextRequest) {
  try {
    const { segments, apiKey } = await request.json();
    if (!segments || typeof segments !== "string" || !segments.trim()) {
      return NextResponse.json({ error: "segments is required" }, { status: 400 });
    }

    const res = await callLlm({ apiKey,
      messages: [
        { role: "system", content: PUSH_STRATEGY_SYSTEM_PROMPT },
        { role: "user", content: buildPushStrategyUserPrompt(segments.trim()) },
      ],
      temperature: 0.7,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.content);
    return NextResponse.json({ strategies: parsed.strategies || [], history: parsed.history || [], usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Push strategy generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
