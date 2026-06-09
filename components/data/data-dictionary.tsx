"use client";

import { useState } from "react";
import { BookOpen, Search, ChevronDown, ChevronRight } from "lucide-react";

interface MetricDef {
  key: string;
  name: string;
  description: string;
  formula: string;
  example: string;
  frequency: string;
  owner: string;
}

const METRICS: MetricDef[] = [
  {
    key: "dau",
    name: "DAU (日活跃用户)",
    description: "每日至少打开一次应用的独立用户数，是衡量产品用户规模和使用频次的核心指标。",
    formula: "COUNT(DISTINCT user_id) WHERE active_date = target_date",
    example: "2026-05-31 DAU = 12,000 表示当天有 12,000 个独立用户使用了产品",
    frequency: "每日更新",
    owner: "数据团队",
  },
  {
    key: "retention_d1",
    name: "次日留存率",
    description: "某日新增用户在次日再次使用的比例，反映产品对新用户的吸引力和首日体验质量。",
    formula: "次日回访用户数 / 当日新增用户数 × 100%",
    example: "5月30日新增 1000 用户，5月31日有 380 人回访 → 次日留存率 = 38%",
    frequency: "每日更新",
    owner: "数据团队",
  },
  {
    key: "retention_d7",
    name: "7日留存率",
    description: "某日新增用户在第7天仍使用的比例，反映产品的中期留存能力。",
    formula: "第7天回访用户数 / 当日新增用户数 × 100%",
    example: "5月24日新增 1000 用户，5月31日有 200 人回访 → 7日留存率 = 20%",
    frequency: "每日更新",
    owner: "数据团队",
  },
  {
    key: "push_open_rate",
    name: "推送打开率",
    description: "收到推送消息的用户中实际打开的比例，衡量推送内容质量和时机选择的有效性。",
    formula: "推送点击用户数 / 推送触达用户数 × 100%",
    example: "发送推送给 50,000 用户，有 6,000 人点击打开 → 推送打开率 = 12%",
    frequency: "每次推送后更新",
    owner: "运营团队",
  },
  {
    key: "ltv",
    name: "LTV (用户生命周期价值)",
    description: "单个用户从注册到流失期间为产品贡献的总收入，用于评估获客成本和用户价值。",
    formula: "ARPU × 平均留存月数 或 Σ(各月收入 × 留存率)",
    example: "ARPU = $5，平均留存 6 个月 → LTV ≈ $30",
    frequency: "每月更新",
    owner: "商业化团队",
  },
  {
    key: "conversion_rate",
    name: "转化率",
    description: "完成目标行为的用户占进入漏斗的用户比例，衡量产品引导和转化的有效性。",
    formula: "完成目标行为的用户数 / 进入漏斗的用户数 × 100%",
    example: "1000 人进入注册流程，650 人完成注册 → 注册转化率 = 65%",
    frequency: "每日更新",
    owner: "产品团队",
  },
  {
    key: "churn_rate",
    name: "周流失率",
    description: "上周活跃但本周未活跃的用户占上周活跃用户的比例，反映用户流失速度。",
    formula: "上周活跃但本周未活跃的用户数 / 上周活跃用户数 × 100%",
    example: "上周活跃 50,000 人，其中 2,500 人本周未活跃 → 周流失率 = 5%",
    frequency: "每周更新",
    owner: "数据团队",
  },
  {
    key: "arpu",
    name: "ARPU (每用户平均收入)",
    description: "特定时间段内总收入除以活跃用户数，衡量用户变现效率。",
    formula: "总收入 / 活跃用户数",
    example: "月收入 $60,000，月活跃 12,000 → ARPU = $5",
    frequency: "每月更新",
    owner: "商业化团队",
  },
];

export function DataDictionary() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = METRICS.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">数据词典</h3>
          <span className="text-xs text-gray-400">{METRICS.length} 个指标定义</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="搜索指标名称或关键词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 pl-9 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">没有匹配的指标定义</p>
          </div>
        ) : (
          filtered.map((metric) => (
            <div key={metric.key}>
              <button
                onClick={() => toggle(metric.key)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {expanded.has(metric.key) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{metric.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{metric.description}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">{metric.key}</span>
              </button>

              {expanded.has(metric.key) && (
                <div className="px-5 pb-4 pl-14 space-y-3 animate-fade-in">
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">描述</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{metric.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">计算公式</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">{metric.formula}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">示例</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{metric.example}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-gray-400">{metric.frequency}</span>
                    <span className="text-[10px] text-gray-400">负责人: {metric.owner}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
