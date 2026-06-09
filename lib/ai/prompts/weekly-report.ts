export const WEEKLY_REPORT_SYSTEM_PROMPT = `你是一个资深产品总监的AI助理，负责撰写产品与运营周报。你需要基于各模块的结构化数据，生成一份专业、有洞察的周报。

严格按以下JSON Schema输出：
{
  "report": {
    "title": "周报标题",
    "period": "报告周期",
    "executiveSummary": "执行摘要（3-5句话，老板只看这个）",
    "sections": [
      {
        "heading": "章节标题",
        "icon": "lucide图标名（如 TrendingUp, Users, Megaphone, FlaskConical, Target, MessageSquare）",
        "content": "章节正文（详细分析）",
        "highlights": ["要点1", "要点2"],
        "risks": ["风险描述1（如果有）"],
        "metricChanges": [
          { "label": "指标名", "current": "当前值", "change": "变化（如 +3.2%）", "trend": "up" | "down" | "stable" }
        ]
      }
    ],
    "nextWeekPlan": ["下周重点事项"],
    "overallMood": "positive" | "neutral" | "urgent",
    "keyTakeaways": ["本次周报最关键的3个结论"]
  }
}

撰写要求：
- 执行摘要必须精炼，让没时间看全文的老板快速了解核心信息
- 每个章节要有数据支撑，不能只写定性描述
- 亮点与风险并重，不要只报喜不报忧
- 指标变化要量化（具体百分比或绝对数字）
- 下周计划要具体可执行，不能写空话
- 整体基调客观专业
- 使用产品/运营领域的专业术语但不过度`;

export function buildWeeklyReportUserPrompt(data: {
  period: string;
  metrics?: { label: string; current: string; change: string; trend: string }[];
  requirements?: { title: string; status: string; priority: string }[];
  activities?: { name: string; status: string; participants: number; conversionRate: number }[];
  experiments?: { name: string; status: string; conclusion: string }[];
  competitorUpdates?: string;
  feedbackSummary?: string;
  customNotes?: string;
}): string {
  return `请根据以下数据生成${data.period}周报：

## 核心指标
${data.metrics?.length ? data.metrics.map(m => `- ${m.label}: ${m.current} (${m.change}, ${m.trend === "up" ? "上升" : m.trend === "down" ? "下降" : "持平"})`).join("\n") : "（无指标数据）"}

## 需求进度
${data.requirements?.length ? data.requirements.map(r => `- [${r.status}] ${r.title} (${r.priority})`).join("\n") : "（无需求数据）"}

## 运营活动
${data.activities?.length ? data.activities.map(a => `- ${a.name}: ${a.status === "active" ? "进行中" : a.status === "ended" ? "已结束" : "即将开始"}, ${a.participants}人参与, 转化率${(a.conversionRate * 100).toFixed(1)}%`).join("\n") : "（无活动数据）"}

## A/B实验
${data.experiments?.length ? data.experiments.map(e => `- ${e.name}: ${e.status === "ended" ? "已结束" : e.status === "running" ? "进行中" : "草稿"}${e.conclusion ? `, 结论: ${e.conclusion}` : ""}`).join("\n") : "（无实验数据）"}

## 竞品动态
${data.competitorUpdates || "（无竞品数据）"}

## 用户反馈
${data.feedbackSummary || "（无反馈数据）"}

${data.customNotes ? `## 补充说明\n${data.customNotes}` : ""}

请生成一份完整的周报，包含执行摘要、各模块分析和下周计划。`;
}
