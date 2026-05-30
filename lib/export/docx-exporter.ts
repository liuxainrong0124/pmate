import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import { FeedbackReport, CompetitorReport, PrdOutput } from "@/types";

// ── Helpers ──

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 240, after: 120 },
  });
}

function para(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 22 })],
    spacing: { after: 80 },
  });
}

function thinBorder() {
  return {
    style: BorderStyle.SINGLE,
    size: 1,
    color: "CCCCCC",
  };
}

// ── Feedback → DOCX ──

export async function exportFeedbackToDocx(report: FeedbackReport): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          heading("用户反馈分析报告", HeadingLevel.TITLE),
          para(report.summary),
          heading("统计概览", HeadingLevel.HEADING_1),
          para(`总反馈量：${report.totalFeedbackCount} 条`),
          para(`涉及分类：${report.categories.join("、")}`),
          para(`洞察数量：${report.insights.length} 条`),

          heading("关键洞察", HeadingLevel.HEADING_1),
          ...report.insights.flatMap((insight, i) => {
            const sevLabels: Record<string, string> = { high: "高优", medium: "中优", low: "低优" };
            return [
              new Paragraph({
                children: [
                  new TextRun({ text: `${i + 1}. ${insight.title}`, bold: true, size: 24 }),
                  new TextRun({ text: `  [${sevLabels[insight.severity]}]`, color: insight.severity === "high" ? "CC0000" : insight.severity === "medium" ? "CC7700" : "339933", size: 20 }),
                ],
                spacing: { before: 160, after: 40 },
              }),
              para(`影响评分：${insight.impactScore}/10 | 提及 ${insight.count} 次 | 情感趋势：${insight.sentimentTrend === "rising" ? "上升" : insight.sentimentTrend === "declining" ? "下降" : "平稳"}`),
              para(`根因分析：${insight.rootCause}`),
              ...(insight.quotes.length > 0
                ? [para(`用户原话："${insight.quotes.join('" / "')}"`)]
                : []),
            ];
          }),

          heading("行动建议", HeadingLevel.HEADING_1),
          ...report.actionItems.map(
            (item, i) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${i + 1}. ${item.what}`, bold: true, size: 22 }),
                  new TextRun({ text: `  [${item.effort === "low" ? "低成本" : item.effort === "medium" ? "中成本" : "高成本"}]`, size: 20, color: "666666" }),
                  new TextRun({ text: `\n原因：${item.why}`, size: 20, color: "666666" }),
                ],
                spacing: { after: 80 },
              })
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ── Competitor → DOCX ──

export async function exportCompetitorToDocx(report: CompetitorReport): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          heading("竞品分析报告", HeadingLevel.TITLE),
          para(report.summary),

          heading("竞品画像", HeadingLevel.HEADING_1),
          ...report.competitorProfiles.flatMap((cp) => [
            para(cp.name, true),
            para(`定位：${cp.overview}`),
            para(`核心功能：${cp.keyFeatures.join("、")}`),
            para(`目标用户：${cp.targetUsers}`),
            para(`近期动态：${cp.recentUpdates}`),
            para(`优势：${cp.strengthSummary}`),
            para(`劣势：${cp.weaknessSummary}`),
            para(""),
          ]),

          heading("维度对比", HeadingLevel.HEADING_1),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["维度", "我方", "竞品", "评估"].map(
                  (h) =>
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
                      borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
                    })
                ),
              }),
              ...report.featureComparison.map(
                (fc) =>
                  new TableRow({
                    children: [
                      fc.dimension,
                      fc.ourPosition,
                      fc.competitorPosition,
                      fc.assessment === "advantage" ? "优势" : fc.assessment === "disadvantage" ? "劣势" : "持平",
                    ].map(
                      (cell) =>
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
                          borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
                        })
                    ),
                  })
              ),
            ],
          }),

          heading("差异化建议", HeadingLevel.HEADING_1),
          para(report.differentiation),
          heading("定价分析", HeadingLevel.HEADING_1),
          para(report.pricingAnalysis),
          heading("竞品动向预测", HeadingLevel.HEADING_1),
          para(report.predictedMoves),

          heading("行动时间线", HeadingLevel.HEADING_1),
          ...report.timeline.flatMap((t) => [
            para(t.phase, true),
            ...t.actions.map((a) => para(`- ${a}`)),
            para(`目标：${t.goal}`),
          ]),

          heading("行动建议", HeadingLevel.HEADING_1),
          ...report.actionItems.map(
            (item, i) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${i + 1}. ${item.what}`, bold: true, size: 22 }),
                  new TextRun({ text: `\n原因：${item.why}`, size: 20, color: "666666" }),
                ],
                spacing: { after: 80 },
              })
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// ── PRD → DOCX ──

export async function exportPrdToDocx(output: PrdOutput): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          heading("产品需求文档", HeadingLevel.TITLE),
          ...output.sections.flatMap((section) => [
            heading(section.title, HeadingLevel.HEADING_1),
            ...section.content.split("\n").map((line) => {
              if (line.startsWith("###")) {
                return heading(line.replace(/^###\s*/, ""), HeadingLevel.HEADING_2);
              }
              if (line.startsWith("##")) {
                return heading(line.replace(/^##\s*/, ""), HeadingLevel.HEADING_1);
              }
              return para(line);
            }),
          ]),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
