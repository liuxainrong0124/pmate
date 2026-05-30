import PptxGenJS from "pptxgenjs";
import { FeedbackReport, CompetitorReport } from "@/types";

// ── Feedback → PPTX ──

export function exportFeedbackToPptx(report: FeedbackReport): PptxGenJS {
  const pptx = new PptxGenJS();

  // Slide 1: Summary
  const slide1 = pptx.addSlide();
  slide1.background = { fill: "F9F9F8" };
  slide1.addText("用户反馈分析报告", {
    x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: "1A1A1A",
  });
  slide1.addText(report.summary, {
    x: 0.5, y: 1.2, w: "90%", fontSize: 14, color: "666666",
  });
  slide1.addText(
    `总反馈量：${report.totalFeedbackCount} 条 | 洞察：${report.insights.length} 条 | 行动建议：${report.actionItems.length} 条`,
    { x: 0.5, y: 2.5, w: "90%", fontSize: 12, color: "999999" }
  );

  // Slide 2+: Each insight
  const sorted = [...report.insights].sort((a, b) => b.impactScore - a.impactScore);
  for (const insight of sorted.slice(0, 8)) {
    const slide = pptx.addSlide();
    slide.background = { fill: "FFFFFF" };

    const sevColors: Record<string, string> = { high: "CC0000", medium: "CC7700", low: "339933" };
    const sevLabels: Record<string, string> = { high: "高优", medium: "中优", low: "低优" };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: "100%", h: 0.08,
      fill: { color: sevColors[insight.severity] },
    });

    slide.addText(insight.title, {
      x: 0.5, y: 0.3, w: "85%", fontSize: 20, bold: true, color: "1A1A1A",
    });

    slide.addText(
      [
        { text: `[${sevLabels[insight.severity]}]  `, options: { color: sevColors[insight.severity], bold: true, fontSize: 12 } },
        { text: `影响评分 ${insight.impactScore}/10  |  `, options: { fontSize: 12, color: "666666" } },
        { text: `提及 ${insight.count} 次  |  `, options: { fontSize: 12, color: "666666" } },
        { text: `趋势：${insight.sentimentTrend === "rising" ? "上升" : insight.sentimentTrend === "declining" ? "下降" : "平稳"}`, options: { fontSize: 12, color: "666666" } },
      ],
      { x: 0.5, y: 1.2, w: "85%" }
    );

    slide.addText(`根因分析：${insight.rootCause}`, {
      x: 0.5, y: 1.8, w: "85%", fontSize: 13, color: "444444",
    });

    if (insight.quotes.length > 0) {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.7, y: 2.5, w: "80%", h: 0.8,
        fill: { color: "F5F5F5" },
      });
      slide.addText(`用户原话："${insight.quotes[0]}"`, {
        x: 0.9, y: 2.6, w: "75%", fontSize: 11, italic: true, color: "888888",
      });
    }
  }

  // Last slide: Action items
  if (report.actionItems.length > 0) {
    const slide = pptx.addSlide();
    slide.background = { fill: "F9F9F8" };
    slide.addText("行动建议", {
      x: 0.5, y: 0.4, w: "90%", fontSize: 24, bold: true, color: "1A1A1A",
    });
    report.actionItems.forEach((item, i) => {
      slide.addText(`${i + 1}. ${item.what}`, {
        x: 0.5, y: 1.0 + i * 0.7, w: "90%", fontSize: 14, bold: true, color: "333333",
      });
      slide.addText(item.why, {
        x: 0.5, y: 1.35 + i * 0.7, w: "90%", fontSize: 11, color: "888888",
      });
    });
  }

  return pptx;
}

// ── Competitor → PPTX ──

export function exportCompetitorToPptx(report: CompetitorReport): PptxGenJS {
  const pptx = new PptxGenJS();

  // Slide 1: Summary
  const slide1 = pptx.addSlide();
  slide1.background = { fill: "F9F9F8" };
  slide1.addText("竞品分析报告", {
    x: 0.5, y: 0.4, w: "90%", fontSize: 28, bold: true, color: "1A1A1A",
  });
  slide1.addText(report.summary, {
    x: 0.5, y: 1.2, w: "90%", fontSize: 14, color: "666666",
  });

  // Competitor profiles
  for (const cp of report.competitorProfiles) {
    const slide = pptx.addSlide();
    slide.background = { fill: "FFFFFF" };
    slide.addText(cp.name, {
      x: 0.5, y: 0.3, w: "90%", fontSize: 22, bold: true, color: "1A1A1A",
    });
    slide.addText(cp.overview, {
      x: 0.5, y: 1.0, w: "90%", fontSize: 13, color: "666666",
    });
    slide.addText(`核心功能：${cp.keyFeatures.join("、")}\n目标用户：${cp.targetUsers}\n近期动态：${cp.recentUpdates}`, {
      x: 0.5, y: 1.8, w: "90%", fontSize: 12, color: "444444",
    });
    if (cp.strengthSummary || cp.weaknessSummary) {
      slide.addText(`优势：${cp.strengthSummary}\n劣势：${cp.weaknessSummary}`, {
        x: 0.5, y: 3.2, w: "90%", fontSize: 12, color: "444444",
      });
    }
  }

  // Timeline
  if (report.timeline.length > 0) {
    const slide = pptx.addSlide();
    slide.background = { fill: "F9F9F8" };
    slide.addText("行动时间线", {
      x: 0.5, y: 0.4, w: "90%", fontSize: 24, bold: true, color: "1A1A1A",
    });
    report.timeline.forEach((t, i) => {
      const y = 1.0 + i * 1.5;
      slide.addText(t.phase, {
        x: 0.5, y, w: "40%", fontSize: 16, bold: true, color: "CC7700",
      });
      slide.addText(t.actions.map((a) => `- ${a}`).join("\n") + `\n目标：${t.goal}`, {
        x: 0.5, y: y + 0.35, w: "90%", fontSize: 12, color: "444444",
      });
    });
  }

  return pptx;
}
