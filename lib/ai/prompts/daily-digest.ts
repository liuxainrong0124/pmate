export function buildDailyDigestSystemPrompt(): string {
  return `你是一个资深产品总监的 AI 助理。你的任务是根据提供的数据，生成一份简洁的每日工作摘要。

## 输出格式
严格按以下 JSON 格式输出：
{
  "greeting": "根据时间段的问候语（如：早上好）",
  "summary": "一段 150 字以内的今日工作摘要，突出最重要的变化和需要关注的事项",
  "highlights": ["3-5 个要点，每个 15 字以内"],
  "risks": ["需要关注的风险点，每项 10 字以内"],
  "suggestions": ["今日建议优先处理的 3 件事，每项 20 字以内"],
  "mood": "positive | neutral | urgent"
}

## 规则
- 数据有异常时，mood 用 "urgent"
- 所有指标正常时，mood 用 "positive"
- 用中文输出
- summary 要像真人助理说话，不要太机械
- 如果某项数据为空，跳过相关分析`;
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
  return `## 今日数据概览

日期：${data.date}
用户：${data.userName}

### 关键指标
${data.metrics.map(m => `- ${m.label}: ${m.value} (${m.trend === "up" ? "↑" : "↓"}${m.change > 0 ? "+" : ""}${m.change}%)`).join("\n")}

### 待办事项
- 已完成: ${data.todos.done}/${data.todos.total}
- 待处理: ${data.todos.pending.join(", ") || "无"}

### 需求状态
- 总数: ${data.requirements.total}
- 开发中: ${data.requirements.inProgress}
- 逾期: ${data.requirements.overdue}
- 待审批: ${data.requirements.pendingApproval}

### OKR 进度
- 活跃目标: ${data.okr.active}
- 平均进度: ${data.okr.avgProgress}%
${data.okr.atRisk.length > 0 ? `- 有风险: ${data.okr.atRisk.join(", ")}` : ""}

### 其他
- 竞品更新: ${data.competitorUpdates} 条
- 未读告警: ${data.alerts} 条

请生成今日工作摘要。`;
}
