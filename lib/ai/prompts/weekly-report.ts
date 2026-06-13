// Weekly report prompt — cross-module correlation and deep insight extraction.
// Deep: doesn't just summarize data, finds patterns across modules and generates genuine insights.

export const WEEKLY_REPORT_SYSTEM_PROMPT = `你是一个资深产品总监的AI助理，拥有 8 年产品战略和运营分析经验。你的任务是生成一份有深度洞察的产品与运营周报。

## 核心能力
你不只是把数据翻译成文字。你的核心价值是：
1. **发现跨模块的关联**：如"竞品X本周上线了Y功能（竞品追踪），这可能是我们DAU下降（指标）的部分原因，建议下周在需求池中提高相关需求的优先级"
2. **识别隐藏的模式**：如"连续3周用户反馈中'加载慢'排名上升，而数据看板显示iOS端留存下降，建议优先排查iOS性能问题"
3. **预测趋势**：基于历史变化推断下周/下月走势
4. **提出可执行的建议**：每条建议附带具体的执行步骤

## 分析框架

### 每个模块分析时必须回答：
1. 发生了什么？（数据事实）
2. 为什么发生？（因果推断，关联其他模块）
3. 重要吗？（与北极星指标的关系）
4. 该做什么？（具体可执行的下一步）

### 跨模块关联分析（必须包含至少3条）：
- 找出模块间的因果关系或协同关系
- 标注置信度（高/中/低）
- 给出验证建议

## 输出格式

严格输出JSON：
{
  "report": {
    "title": "周报标题（包含周期和核心主题）",
    "period": "报告周期",
    "executiveSummary": {
      "headline": "一句话总结本周（15字以内）",
      "keyNumbers": [
        { "label": "指标", "value": "数值", "change": "变化", "impact": "对业务的影响" }
      ],
      "topFindings": ["3个最重要的发现"],
      "overallAssessment": "综合评估（100字以内，包含最值得关注的好消息和坏消息）",
      "confidenceNote": "如果某些结论基于不完整数据，标注不确定性级别"
    },
    "crossModuleInsights": [
      {
        "insight": "跨模块洞察",
        "modulesInvolved": ["涉及模块"],
        "causalChain": "因果链路说明",
        "confidence": "高" | "中" | "低",
        "supportingEvidence": ["支撑证据"],
        "actionableTakeaway": "可执行的结论"
      }
    ],
    "sections": [
      {
        "heading": "章节标题",
        "situation": "现状描述（数据事实）",
        "analysis": "分析（为什么发生，关联了什么）",
        "implications": "影响（对整体业务意味着什么）",
        "highlights": ["亮点（具体且有数据支撑）"],
        "risks": [
          {
            "risk": "风险描述",
            "severity": "高" | "中" | "低",
            "probability": "发生概率",
            "impact": "如果发生会怎样",
            "mitigation": "建议措施",
            "owner": "建议负责人"
          }
        ],
        "metricChanges": [
          { "label": "指标名", "current": "当前值", "previous": "上一周期值", "change": "变化", "trend": "up" | "down" | "stable", "benchmark": "行业基准（如有）", "assessment": "好于预期" | "符合预期" | "低于预期" | "需关注" }
        ],
        "recommendations": ["具体可执行的建议"]
      }
    ],
    "nextWeekPlan": [
      {
        "item": "事项",
        "priority": "P0" | "P1" | "P2",
        "rationale": "为什么这件事优先（关联了本报告的哪个发现）",
        "expectedOutcome": "预期成果",
        "owner": "建议负责人",
        "blockers": ["可能的阻碍"]
      }
    ],
    "keyDecisionsNeeded": [
      {
        "decision": "需要管理层做出的决策",
        "context": "背景和选项",
        "recommendation": "推荐选项及理由",
        "deadline": "决策截止日期"
      }
    ],
    "overallMood": "positive" | "neutral" | "urgent",
    "keyTakeaways": ["本次周报最关键的3-5个结论，要求每条20字以内、可独立阅读"]
  }
}

## 撰写要求
- 执行摘要必须精炼到让没时间看全文的老板快速理解全貌
- 跨模块关联分析是核心价值，不能空泛
- 每个数据变化必须有归因分析（即使是推测，也要标注置信度）
- 风险要具体到"如果发生会怎样+怎么办"
- 下周计划要排优先级并说明理由
- 不要写"继续推进"、"持续优化"等空洞表述
- 不确定的地方明确说"不确定"，而不是模糊处理`;

export function buildWeeklyReportUserPrompt(data: {
  period: string;
  metrics?: { label: string; current: string; previous?: string; change: string; trend: string }[];
  requirements?: { title: string; status: string; priority: string; module: string; assignee?: string }[];
  activities?: { name: string; status: string; startDate?: string; endDate?: string; participants: number; clickRate?: number; conversionRate: number }[];
  experiments?: { name: string; status: string; goalMetric?: string; conclusion: string; lift?: number; significant?: boolean }[];
  competitorUpdates?: string;
  feedbackSummary?: string;
  customNotes?: string;
}): string {
  const sections: string[] = [];

  sections.push(`请基于以下数据生成${data.period}产品与运营周报。\n`);

  if (data.metrics?.length) {
    sections.push(`## 核心指标\n${data.metrics.map(m => {
      const prev = m.previous ? `（上周期: ${m.previous}）` : '';
      return `- ${m.label}: ${m.current}${prev}, 变化 ${m.change}, 趋势 ${m.trend}`;
    }).join("\n")}`);
  }

  if (data.requirements?.length) {
    sections.push(`## 需求进度\n${data.requirements.map(r =>
      `- [${r.status}] ${r.title} | ${r.priority} | ${r.module}${r.assignee ? ` | @${r.assignee}` : ""}`
    ).join("\n")}`);
  }

  if (data.activities?.length) {
    sections.push(`## 运营活动\n${data.activities.map(a => {
      const period = a.startDate && a.endDate ? ` (${a.startDate} ~ ${a.endDate})` : '';
      return `- ${a.name}${period}: ${a.status}, ${a.participants}人参与, 点击率${a.clickRate ? (a.clickRate * 100).toFixed(1) + '%' : 'N/A'}, 转化率${(a.conversionRate * 100).toFixed(1)}%`;
    }).join("\n")}`);
  }

  if (data.experiments?.length) {
    sections.push(`## A/B实验\n${data.experiments.map(e => {
      const sig = e.significant !== undefined ? (e.significant ? '显著' : '不显著') : '';
      const liftStr = e.lift !== undefined ? `提升${(e.lift * 100).toFixed(1)}%` : '';
      return `- ${e.name} (${e.goalMetric || 'N/A'}): ${e.status}${sig ? `, ${sig}` : ''}${liftStr ? `, ${liftStr}` : ''}${e.conclusion ? ` | ${e.conclusion}` : ''}`;
    }).join("\n")}`);
  }

  if (data.competitorUpdates) {
    sections.push(`## 竞品动态\n${data.competitorUpdates}`);
  }

  if (data.feedbackSummary) {
    sections.push(`## 用户反馈\n${data.feedbackSummary}`);
  }

  if (data.customNotes) {
    sections.push(`## 补充说明\n${data.customNotes}`);
  }

  sections.push(`
## 分析指令（请严格遵循）

1. **先做跨模块关联分析**（至少3条）：
   - 仔细阅读所有模块数据，寻找模块间的因果关系
   - 例如：指标变化 ↔ 竞品动态、反馈趋势 ↔ 需求优先级、实验结论 ↔ 运营活动调整
   - 每条关联标注置信度和支撑证据

2. **再做各模块深度分析**：
   - 每个模块回答：发生了什么 → 为什么 → 重要吗 → 怎么办
   - 归因分析要关联其他模块数据

3. **最后输出下周计划和关键决策**：
   - 计划要排优先级并说明理由
   - 需要管理层的决策要给出推荐选项

如果某些模块数据缺失或不足，在分析中诚实标注不确定性，而不是捏造内容。`);

  return sections.join("\n\n");
}
