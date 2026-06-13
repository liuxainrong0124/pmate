import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";
import { toStringArray } from "@/lib/ai/parsers/utils";

const SYSTEM_PROMPT = `你是一个竞品情报分析师，专门追踪科技公司和互联网产品的动态。

## 任务
根据用户提供的竞品名称，生成该公司/产品近期的关键动态。你需要基于你的知识，尽可能模拟真实的新闻动态。

## 输出格式
严格按以下JSON输出：
{
  "news": [
    {
      "title": "新闻标题（15字以内，中文）",
      "summary": "新闻摘要（50-80字）",
      "date": "YYYY-MM-DD（模拟近期日期，在过去30天内）",
      "category": "产品更新" | "融资并购" | "战略合作" | "人事变动" | "市场扩张" | "定价策略" | "技术突破",
      "impact": "对竞争格局的影响分析（30字以内）",
      "url": ""
    }
  ],
  "trendSummary": "近期趋势一句话总结",
  "keyChanges": ["关键变化1", "关键变化2"]
}

要求：
- 每个竞品生成 3-5 条动态
- 日期应在过去 30 天内，分布合理
- 类别多样化，不要全是同一类
- impact 要有实质内容
- 基于你对这些公司的真实了解，不要编造过于离谱的信息`;

export async function POST(request: NextRequest) {
  try {
    const { competitors, apiKey } = await request.json();
    if (!competitors || typeof competitors !== "string") {
      return NextResponse.json({ error: "competitors is required" }, { status: 400 });
    }

    const names = competitors.split("\n").filter((s: string) => s.trim());
    if (names.length === 0) {
      return NextResponse.json({ error: "at least one competitor name required" }, { status: 400 });
    }

    const userPrompt = `请为以下竞品生成近期动态：\n${names.map((n: string) => `- ${n.trim()}`).join("\n")}\n\n请为每个竞品生成3-5条动态，日期分布在过去30天内。`;

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      responseFormat: "json_object",
    });

    let parsed;
    try {
      parsed = JSON.parse(res.content);
    } catch {
      const m = res.content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI response invalid");
      parsed = JSON.parse(m[0]);
    }

    return NextResponse.json({
      news: Array.isArray(parsed.news) ? parsed.news.slice(0, 20).map((n: Record<string, unknown>) => ({
        title: String(n.title || ""),
        summary: String(n.summary || ""),
        date: String(n.date || ""),
        category: String(n.category || "产品更新"),
        impact: String(n.impact || ""),
        url: String(n.url || ""),
      })) : [],
      trendSummary: String(parsed.trendSummary || ""),
      keyChanges: toStringArray(parsed.keyChanges),
      usage: res.usage,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "News fetch failed" },
      { status: 500 }
    );
  }
}
