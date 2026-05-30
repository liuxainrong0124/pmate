import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { PERSONA_SYSTEM_PROMPT, buildPersonaUserPrompt } from "@/lib/ai/prompts/persona";
import { parsePersonaResponse } from "@/lib/ai/parsers/persona-parser";

export async function POST(request: NextRequest) {
  try {
    const { segmentName, segmentDesc, characteristics, apiKey } = await request.json();
    if (!segmentName || typeof segmentName !== "string") {
      return NextResponse.json({ error: "segmentName is required" }, { status: 400 });
    }

    const res = await callLlm({ apiKey,
      messages: [
        { role: "system", content: PERSONA_SYSTEM_PROMPT },
        { role: "user", content: buildPersonaUserPrompt(segmentName, segmentDesc || "", characteristics || []) },
      ],
      temperature: 0.7,
      responseFormat: "json_object",
    });

    const personas = parsePersonaResponse(res.content);
    return NextResponse.json({ personas, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Persona generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
