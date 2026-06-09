import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { EXPERIMENT_SYSTEM_PROMPT, buildExperimentUserPrompt } from "@/lib/ai/prompts/experiment";

export async function POST(request: NextRequest) {
  try {
    const { experiment, apiKey } = await request.json();
    if (!experiment || !experiment.name || !experiment.goalMetric) {
      return NextResponse.json({ error: "experiment.name and experiment.goalMetric are required" }, { status: 400 });
    }

    const { name, goalMetric, groupA, groupB, plannedDays } = experiment;
    if (!groupA?.sample || !groupB?.sample) {
      return NextResponse.json({ error: "Both groups must have sample data" }, { status: 400 });
    }

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: EXPERIMENT_SYSTEM_PROMPT },
        { role: "user", content: buildExperimentUserPrompt(name, goalMetric, groupA, groupB, plannedDays || 7) },
      ],
      temperature: 0.3,
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.content);
    return NextResponse.json({ analysis: parsed.analysis || null, usage: res.usage });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Experiment analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
