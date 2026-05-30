# Pulse — AI 产品与运营工作台

产品经理和运营的 AI 原生工作台，覆盖需求、数据、用户、运营全流程。

## 模块

| 模块 | 说明 |
|------|------|
| 仪表盘 | 关键指标速览、待办、异常提醒 |
| 需求中心 | PRD 编辑器、异常场景生成、需求池 |
| 数据洞察 | KPI 看板、趋势图、异动归因、CSV 导入 |
| 用户中心 | 用户分层、画像生成、反馈聚合 |
| 运营中心 | AI 推送文案生成、推送策略推荐 |
| 竞品追踪 | 竞品分析 |
| 版本管理 | 版本规划、需求关联、发布与复盘 |
| 运营活动 | 活动日历、模板管理 |
| A/B 测试 | 实验创建、实时数据模拟、结论分析 |
| 团队协作 | 成员管理、操作日志 |

## 技术栈

Next.js 14 + React + TypeScript + Tailwind CSS + shadcn/ui

## 本地运行

```bash
npm install
npm run dev
```

打开 http://localhost:3000 查看入场页，或直接访问 http://localhost:3000/dashboard 进入工作台。

## 环境变量

复制 `.env.example` 为 `.env.local`，填入 API Key：

```
DEEPSEEK_API_KEY=你的Key
```

## 部署

已配置 Vercel 和 Netlify，推荐 Vercel 一键部署。
