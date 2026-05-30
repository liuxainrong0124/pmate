import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { FEEDBACK_SYSTEM_PROMPT, buildFeedbackUserPrompt } from "@/lib/ai/prompts/feedback";
import { parseFeedbackResponse } from "@/lib/ai/parsers/feedback-parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackText, customDimensions, apiKey } = body;

    if (!feedbackText || typeof feedbackText !== "string" || feedbackText.trim().length === 0) {
      return NextResponse.json(
        { error: "feedbackText is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (feedbackText.length > 50000) {
      return NextResponse.json(
        { error: "feedbackText must be under 50,000 characters" },
        { status: 400 }
      );
    }

    const response = await callLlm({ apiKey,
      messages: [
        { role: "system", content: FEEDBACK_SYSTEM_PROMPT },
        { role: "user", content: buildFeedbackUserPrompt(feedbackText, customDimensions) },
      ],
      temperature: 0.3,
      responseFormat: "json_object",
    });

    const report = parseFeedbackResponse(response.content);

    return NextResponse.json({ report, usage: response.usage });
  } catch (error: unknown) {
    console.error("Feedback analysis error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
