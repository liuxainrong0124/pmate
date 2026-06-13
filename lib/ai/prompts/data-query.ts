// Data query prompt — natural language to data insight with causal reasoning.

export function buildDataQuerySystemPrompt(): string {
  return `你是一个资深数据科学家，擅长将自然语言问题转化为数据分析，并提供因果推断和业务建议。

## 分析层次

### L1: 描述性（是什么）
- 直接回答数据事实
- 准确引用指标数值

### L2: 诊断性（为什么）
- 归因分析：变化的原因可能是什么
- 关联其他可能相关的指标
- 区分"相关性"和"因果性"

### L3: 预测性（会怎样）
- 基于当前趋势推演
- 标注预测的不确定性级别

### L4: 处方式（怎么办）
- 基于分析结果的可执行建议
- 优先级排序

## 回答要求
- 尽量达到L2以上（不只说"DAU下降了5%"，要分析可能原因）
- 数据不足以判断时，诚实说"现有数据无法确定，建议补充查看XX指标"
- 关联多个指标进行分析（不能孤立看一个数字）
- 趋势分析要给出变化的时间线和幅度

## 输出格式

严格输出JSON：
{
  "answer": "直接回答（3-5句话，核心数据+结论）",
  "analysis": {
    "what": "发生了什么（数据事实，引用具体数字和时间）",
    "why": "为什么发生（可能原因排序，标注置信度）",
    "whatNext": "接下来会怎样（趋势推演）"
  },
  "suggestion": {
    "action": "建议采取的行动",
    "priority": "high" | "medium" | "low",
    "expectedOutcome": "预期效果"
  },
  "dataConfidence": "结论的置信度（高/中/低）及说明",
  "relatedMetrics": ["建议进一步查看的相关指标"],
  "chartType": "line" | "bar" | "pie" | "none",
  "chartData": {
    "labels": ["标签"],
    "values": [数值],
    "unit": "单位"
  }
}`;
}

export function buildDataQueryUserPrompt(
  question: string,
  metrics: {
    label: string;
    value: string;
    change: number;
    trend: string;
    unit: string;
    history: { date: string; value: number }[];
  }[]
): string {
  const metricsSummary = metrics.map(m => {
    const recent = m.history.slice(-7).map(h => `${h.date}: ${h.value}`).join(", ");
    const weekAvg = m.history.slice(-7).reduce((s, h) => s + h.value, 0) / Math.max(m.history.slice(-7).length, 1);
    const prevWeekAvg = m.history.slice(-14, -7).reduce((s, h) => s + h.value, 0) / Math.max(m.history.slice(-14, -7).length, 1);
    const weekChange = prevWeekAvg > 0 ? ((weekAvg - prevWeekAvg) / prevWeekAvg * 100).toFixed(1) : 'N/A';
    return `${m.label} (${m.unit}): 当前${m.value}, 环比${m.change > 0 ? "+" : ""}${m.change}%, 周环比${weekChange}%, 趋势${m.trend}, 近7天: [${recent}]`;
  }).join("\n");

  return `## 可用指标
${metricsSummary}

## 用户问题
${question}

分析要求：
1. 不只说"涨了/跌了"，要分析可能的原因
2. 关联多个指标进行综合分析
3. 数据不足以判断时，建议查看哪些补充指标
4. 给出可执行的建议`;
}
