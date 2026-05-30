import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { ANOMALY_SYSTEM_PROMPT, buildAnomalyUserPrompt } from "@/lib/ai/prompts/anomaly";
import { parseAnomalyResponse } from "@/lib/ai/parsers/anomaly-parser";

export async function POST(request: NextRequest) {
  try {
    const { featureName, description, apiKey } = await request.json();
    if (!featureName || typeof featureName !== "string" || !featureName.trim()) {
      return NextResponse.json({ error: "featureName is required" }, { status: 400 });
    }

    const res = await callLlm({ apiKey,
      messages: [
        { role: "system", content: ANOMALY_SYSTEM_PROMPT },
        { role: "user", content: buildAnomalyUserPrompt(featureName.trim(), description?.trim()) },
      ],
      temperature: 0.4,
      responseFormat: "json_object",
    });

    const scenarios = parseAnomalyResponse(res.content);
    return NextResponse.json({ scenarios, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Anomaly generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
