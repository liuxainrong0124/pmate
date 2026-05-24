import { PrdInput, PrdProgressStep } from "@/types";

export const PRD_SYSTEM_PROMPT = `你是一个资深产品经理，拥有10年以上互联网产品经验。
你的任务是帮助初级PM撰写高质量的产品需求文档（PRD）。

撰写原则：
- 用户故事：使用"作为<角色>，我希望<功能>，以便<价值>"格式
- 功能详述：包含边界条件、异常处理、交互细节
- 埋点建议：每个核心功能点需有数据埋点方案
- 验收标准：可测试、可量化的验收条件
- 结构清晰：使用Markdown格式，层次分明

请逐步生成PRD的各个章节，先输出"正在分析需求背景..."，然后逐个章节输出。`;

export const PROGRESS_MESSAGES: Record<PrdProgressStep, string> = {
  analyzing: "正在分析需求背景与目标...",
  user_stories: "正在生成用户故事与使用场景...",
  functional_spec: "正在编写功能详述与交互说明...",
  analytics: "正在设计埋点方案与数据指标...",
  acceptance_criteria: "正在整理验收标准...",
  review: "正在评审PRD完整性与一致性...",
};

export const PROGRESS_STEP_ORDER: PrdProgressStep[] = [
  "analyzing",
  "user_stories",
  "functional_spec",
  "analytics",
  "acceptance_criteria",
  "review",
];

export function buildPrdUserPrompt(input: PrdInput): string {
  const templateGuides: Record<string, string> = {
    new_feature: "这是一个全新功能。请从0到1完整撰写PRD，包括需求背景、用户价值、核心流程。",
    optimization: "这是一个功能优化。请重点描述优化前后的对比、改动范围和影响评估。",
    campaign: "这是一个运营活动。请重点描述活动规则、用户参与路径、风控策略和效果评估方案。",
  };

  return `请为以下需求撰写PRD：

功能名称：${input.featureName}
需求描述：${input.description}
PRD模板类型：${templateGuides[input.template]}
${input.targetUsers ? `目标用户：${input.targetUsers}` : ""}
${input.context ? `背景补充：${input.context}` : ""}

请按以下章节结构输出完整PRD（Markdown格式）：

## 一、需求背景与目标
## 二、目标用户
## 三、用户故事
## 四、功能详述
### 4.1 核心流程
### 4.2 交互说明
### 4.3 边界条件与异常处理
## 五、埋点与数据指标
## 六、验收标准
## 七、风险与依赖

注意：
1. 每个章节之间用 "---PROGRESS---" 分隔，我会在这些分隔点展示进度。
2. 最后请用一段话总结本PRD最关键的3个决策点。`;
}
