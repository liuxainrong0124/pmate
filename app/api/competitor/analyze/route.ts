import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { COMPETITOR_SYSTEM_PROMPT, buildCompetitorUserPrompt } from "@/lib/ai/prompts/competitor";
import { parseCompetitorResponse } from "@/lib/ai/parsers/competitor-parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitors, context, apiKey } = body;

    if (!competitors || typeof competitors !== "string" || competitors.trim().length === 0) {
      return NextResponse.json(
        { error: "competitors is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (competitors.length > 5000) {
      return NextResponse.json(
        { error: "competitors must be under 5,000 characters" },
        { status: 400 }
      );
    }

    const response = await callLlm({ apiKey,
      messages: [
        { role: "system", content: COMPETITOR_SYSTEM_PROMPT },
        { role: "user", content: buildCompetitorUserPrompt(competitors, context) },
      ],
      temperature: 0.3,
      responseFormat: "json_object",
    });

    const report = parseCompetitorResponse(response.content);

    return NextResponse.json({ report, usage: response.usage });
  } catch (error: unknown) {
    console.error("Competitor analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
