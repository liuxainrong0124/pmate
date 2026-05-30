import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { PUSH_COPY_SYSTEM_PROMPT, buildPushCopyUserPrompt } from "@/lib/ai/prompts/push-copy";
import { parsePushCopyResponse } from "@/lib/ai/parsers/push-copy-parser";

export async function POST(request: NextRequest) {
  try {
    const { targetUsers, purpose, apiKey } = await request.json();
    if (!purpose || typeof purpose !== "string" || !purpose.trim()) {
      return NextResponse.json({ error: "purpose is required" }, { status: 400 });
    }

    const res = await callLlm({ apiKey,
      messages: [
        { role: "system", content: PUSH_COPY_SYSTEM_PROMPT },
        { role: "user", content: buildPushCopyUserPrompt(targetUsers || "", purpose.trim()) },
      ],
      temperature: 0.8,
      responseFormat: "json_object",
    });

    const variants = parsePushCopyResponse(res.content);
    return NextResponse.json({ variants, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Push copy generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
