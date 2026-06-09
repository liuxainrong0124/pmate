import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { ACTIVITY_SYSTEM_PROMPT, buildActivityUserPrompt } from "@/lib/ai/prompts/activity";

export async function POST(request: NextRequest) {
  try {
    const { goal, targetAudience, budget, channels, duration, apiKey } = await request.json();
    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: ACTIVITY_SYSTEM_PROMPT },
        { role: "user", content: buildActivityUserPrompt(
          goal.trim(),
          targetAudience || "",
          budget || "",
          channels || "",
          duration || "7天"
        ) },
      ],
      temperature: 0.7,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.content);
    return NextResponse.json({ plan: parsed.plan || null, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Activity plan generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
