import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { SEGMENTATION_SYSTEM_PROMPT, buildSegmentationUserPrompt } from "@/lib/ai/prompts/segmentation";

export async function POST(request: NextRequest) {
  try {
    const { productContext, apiKey } = await request.json();

    const res = await callLlm({ apiKey,
      messages: [
        { role: "system", content: SEGMENTATION_SYSTEM_PROMPT },
        { role: "user", content: buildSegmentationUserPrompt(productContext || "") },
      ],
      temperature: 0.6,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.content);
    return NextResponse.json({ segments: parsed.segments || [], totalUsers: parsed.totalUsers || 0, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Segmentation generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
