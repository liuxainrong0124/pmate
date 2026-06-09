export function buildDataQuerySystemPrompt(): string {
  return `你是一个数据分析助手。你可以访问用户的指标数据，并根据自然语言问题给出分析。

## 输出格式
严格按以下 JSON 格式输出：
{
  "answer": "直接回答用户的问题，2-4 句话，用数据说话",
  "analysis": "深入分析原因或趋势，100 字以内",
  "suggestion": "基于数据给出的建议，1-2 句话",
  "relatedMetric": "最相关的指标名称",
  "chartType": "line | bar | none (是否需要图表)"
}

## 规则
- 用中文回答
- 数据要准确引用
- 如果问的是趋势/变化，给出来自哪个指标
- 如果数据不足以回答，诚实说明`;
}

export function buildDataQueryUserPrompt(question: string, metrics: { label: string; value: string; change: number; trend: string; unit: string; history: { date: string; value: number }[] }[]): string {
  const metricsSummary = metrics.map(m => {
    const recent = m.history.slice(-7).map(h => `${h.date}: ${h.value}`).join(", ");
    return `${m.label} (${m.unit}): 当前 ${m.value}, 环比 ${m.change > 0 ? "+" : ""}${m.change}%, 趋势 ${m.trend === "up" ? "上升" : "下降"}, 近7天: [${recent}]`;
  }).join("\n");

  return `## 可用指标数据

${metricsSummary}

## 用户问题

${question}

请用上述数据分析回答用户问题。`;
}
