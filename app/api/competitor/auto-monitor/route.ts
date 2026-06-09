import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/ai/client";

const SYSTEM_PROMPT = `你是一个竞品情报分析师，专门追踪科技公司和互联网产品的动态。

## 任务
根据用户提供的竞品名称列表，生成每个竞品近期的关键动态。你需要基于你的知识，尽可能模拟真实的新闻动态。

## 输出格式
严格按以下JSON输出：
{
  "updates": [
    {
      "competitor": "竞品名称",
      "news": [
        {
          "title": "新闻标题（15字以内，中文）",
          "summary": "新闻摘要（30-50字）",
          "category": "产品更新" | "融资并购" | "战略合作" | "人事变动" | "市场扩张" | "定价策略" | "技术突破",
          "impact": "对我方的影响（20字以内）",
          "date": "YYYY-MM-DD"
        }
      ]
    }
  ],
  "overallTrend": "整体竞争格局趋势一句话总结",
  "alerts": ["需要关注的告警信息1", "需要关注的告警信息2"]
}

要求：
- 每个竞品生成2-4条动态
- 日期应在过去14天内
- 类别多样化
- alerts 只列出真正重要的事项（如竞品发布重大功能、融资、进入新市场等）`;

export async function POST(request: NextRequest) {
  try {
    const { competitors, apiKey } = await request.json();

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json({ error: "competitors array is required" }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
    }

    const names = competitors.filter((s: unknown) => typeof s === "string" && s.trim());
    if (names.length === 0) {
      return NextResponse.json({ error: "at least one competitor name required" }, { status: 400 });
    }

    const userPrompt = `请为以下竞品生成近14天内的动态：\n${names.map((n: string) => `- ${n.trim()}`).join("\n")}`;

    const res = await callLlm({
      apiKey,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
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

    const updates: { competitor: string; news: { title: string; summary: string; category: string; impact: string; date: string }[] }[] = Array.isArray(parsed.updates) ? parsed.updates.map((u: Record<string, unknown>) => ({
      competitor: String(u.competitor || ""),
      news: Array.isArray(u.news) ? u.news.slice(0, 5).map((n: Record<string, unknown>) => ({
        title: String(n.title || ""),
        summary: String(n.summary || ""),
        category: String(n.category || "产品更新"),
        impact: String(n.impact || ""),
        date: String(n.date || ""),
      })) : [],
    })) : [];

    // Generate a hash from the news titles to detect changes
    const newsHash = JSON.stringify(updates.map(u => u.news.map(n => n.title)));

    const result = {
      updates,
      overallTrend: String(parsed.overallTrend || ""),
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts.map(String) : [],
      newsHash,
      checkedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Auto-monitor failed" },
      { status: 500 }
    );
  }
}
