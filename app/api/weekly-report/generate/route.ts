import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { apiErrorStatus } from "@/lib/utils";
import { WEEKLY_REPORT_SYSTEM_PROMPT, buildWeeklyReportUserPrompt } from "@/lib/ai/prompts/weekly-report";

export async function POST(request: NextRequest) {
  try {
    const { data, apiKey } = await request.json();
    if (!data || !data.period) {
      return NextResponse.json({ error: "data.period is required" }, { status: 400 });
    }

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: WEEKLY_REPORT_SYSTEM_PROMPT },
        { role: "user", content: buildWeeklyReportUserPrompt(data) },
      ],
      temperature: 0.5,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.content);
    return NextResponse.json({ report: parsed.report || null, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Weekly report generation failed";
    return NextResponse.json({ error: msg }, { status: apiErrorStatus(e) });
  }
}
