// Daily digest prompt — AI-powered daily briefing with insight extraction and prioritization.

export function buildDailyDigestSystemPrompt(): string {
  return `你是一个资深产品总监的 AI 助理。你的任务是根据今日数据，生成一份有洞察力的每日工作摘要。

## 摘要要求

### 好的摘要
- 开门见山说最重要的变化（不铺垫、不寒暄）
- 数据异常立即标注（如"⚠️ DAU 较昨日下降 5.2%，需关注"）
- 指出需要立即行动的事项
- 关联多个指标进行分析（不能孤立看一个数字）

### 坏的摘要
- "今日工作顺利，各项指标正常" —— 这是废话
- 罗列数据但没有分析
- 只说"XX下降了"但不说可能原因和建议
- 过度乐观或过度悲观

## 输出格式

严格输出JSON：
{
  "greeting": "根据时间段问候 + 一句话核心变化（如：早上好。今日DAU较昨日下降5.2%，竞品A上线了新功能。）",
  "headline": "今日最值得关注的一件事（15字以内）",
  "summary": "今日工作摘要（120字以内，包含最重要的变化、需要关注的事项、今日优先行动）",
  "highlights": [
    { "point": "要点", "indicator": "good" | "warning" | "info", "detail": "具体说明" }
  ],
  "risks": [
    { "risk": "风险描述", "severity": "high" | "medium", "action": "建议行动" }
  ],
  "schedule": [
    { "priority": 1-3, "task": "今日优先事项", "reason": "为什么今天必须做", "duration": "预计耗时" }
  ],
  "mood": "positive" | "neutral" | "urgent",
  "moodReason": "mood的判定理由"
}`;
}

export function buildDailyDigestUserPrompt(data: {
  date: string;
  userName: string;
  metrics: { label: string; value: string; change: number; trend: string }[];
  todos: { done: number; total: number; pending: string[] };
  requirements: { total: number; inProgress: number; overdue: number; pendingApproval: number };
  okr: { active: number; avgProgress: number; atRisk: string[] };
  competitorUpdates: number;
  alerts: number;
}): string {
  const urgentFlags: string[] = [];
  if (data.requirements.overdue > 0) urgentFlags.push(`${data.requirements.overdue}个需求已逾期`);
  if (data.okr.atRisk.length > 0) urgentFlags.push(`OKR目标"${data.okr.atRisk.join('、')}"有风险`);
  if (data.alerts > 0) urgentFlags.push(`${data.alerts}条未读告警`);

  return `## 今日数据 (${data.date})

用户：${data.userName}
${urgentFlags.length > 0 ? `⚠️ 紧急信号: ${urgentFlags.join('；')}` : ''}

### 关键指标
${data.metrics.map(m => {
    const arrow = m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→";
    const alert = m.trend === "down" && Math.abs(m.change) > 5 ? " ⚠️" : "";
    return `- ${m.label}: ${m.value} (${arrow}${m.change > 0 ? "+" : ""}${m.change}%)${alert}`;
  }).join("\n")}

### 待办
- 已完成: ${data.todos.done}/${data.todos.total}
- 待处理: ${data.todos.pending.join(", ") || "无"}

### 需求
- 总数: ${data.requirements.total} | 开发中: ${data.requirements.inProgress} | 逾期: ${data.requirements.overdue} | 待审批: ${data.requirements.pendingApproval}

### OKR
- 活跃目标: ${data.okr.active} | 平均进度: ${data.okr.avgProgress}%
${data.okr.atRisk.length > 0 ? `- 有风险: ${data.okr.atRisk.join(", ")}` : ""}

### 其他
- 竞品动态: ${data.competitorUpdates} 条新内容
- 未读告警: ${data.alerts} 条

请基于以上数据生成今日工作摘要。重点关注：指标异常、逾期需求、OKR风险、竞品动态。`;
}
