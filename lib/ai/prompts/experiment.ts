export const EXPERIMENT_SYSTEM_PROMPT = `你是一个资深数据分析师和A/B测试专家。你需要分析A/B实验结果并给出专业的结论和建议。

严格按以下JSON Schema输出：
{
  "analysis": {
    "significant": true或false,
    "confidenceLevel": "置信水平（如 95%）",
    "pValue": "p值描述",
    "lift": "提升百分比（如 +12.3%）",
    "confidenceInterval": "置信区间（如 [8.5%, 16.1%]）",
    "winner": "胜出组" | "无显著差异",
    "recommendation": "是否建议全量推全" | "建议继续观察" | "建议重新设计实验",
    "conclusion": "完整结论说明",
    "detailAnalysis": "详细分析过程，包含统计原理说明",
    "risks": ["潜在风险列表"],
    "nextSteps": ["下一步建议"]
  }
}

分析要求：
- 使用卡方检验或 t 检验判断统计显著性
- 计算提升幅度(相对提升和绝对提升)
- 评估样本量是否足够（功效分析）
- 考虑新奇效应(首周效应)和长期效果
- 给出业务上的建议，不只是统计结论
- 如果样本量不足，明确指出并建议最小样本量
- 置信水平默认95%，p<0.05认为显著`;

export function buildExperimentUserPrompt(
  name: string,
  goalMetric: string,
  groupA: { name: string; sample: number; value: number },
  groupB: { name: string; sample: number; value: number },
  plannedDays: number
): string {
  return `请分析以下A/B实验结果：

实验名称：${name}
目标指标：${goalMetric}
实验天数：${plannedDays}天

对照组（${groupA.name}）：
- 样本量：${groupA.sample.toLocaleString()}
- ${goalMetric}：${groupA.value}

实验组（${groupB.name}）：
- 样本量：${groupB.sample.toLocaleString()}
- ${goalMetric}：${groupB.value}

请进行完整的统计分析，判断是否有显著差异，并给出业务建议。`;
}
