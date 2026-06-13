"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Target, Sparkles, Loader2 } from "lucide-react";
import { getUserApiKey, getItem, setItem, getUploadedMetrics, getFeedbackHistory, getActivities, getExperiments } from "@/lib/store/local-store";

interface StrategyItem {
  segment: string;
  bestTime: string;
  timeBasis?: string;
  bestChannel: string;
  channelBasis?: string;
  frequency: string;
  frequencyBasis?: string;
  expectedOpenRate: string;
  notes: string;
  color: string;
  confidence?: string;
  dataRange?: string;
}

interface HistoryItem {
  date: string;
  campaign: string;
  segment: string;
  sent: number;
  opened: number;
  ctr: number;
  conversion: number;
}

interface StrategyData {
  strategies: StrategyItem[];
  history: HistoryItem[];
}

const DEFAULT_STRATEGIES: StrategyData = {
  strategies: [
    { segment: "重度用户", bestTime: "19:00 - 21:00", bestChannel: "App Push + 应用内消息", frequency: "1-2 次/周", expectedOpenRate: "32% - 38%", notes: "偏好体验新功能，适合产品更新类推送。避免过度打扰，重点推送 VIP 权益和新功能内测邀请。", color: "#6366F1" },
    { segment: "普通用户", bestTime: "12:00 - 13:30", bestChannel: "App Push + 短信", frequency: "2-3 次/周", expectedOpenRate: "18% - 24%", notes: "午休时段打开率最高。适合推送使用技巧、限时优惠。通过从众效应文案激发活跃。", color: "#10B981" },
    { segment: "流失风险", bestTime: "20:00 - 22:00", bestChannel: "App Push + 邮件 + 短信", frequency: "1 次/周", expectedOpenRate: "8% - 12%", notes: "晚间时段用户放松，更容易接受召回信息。推送核心功能价值和情感类内容。", color: "#F59E0B" },
    { segment: "已流失", bestTime: "周五 18:00 - 20:00", bestChannel: "邮件 + 短信", frequency: "1 次/月", expectedOpenRate: "3% - 5%", notes: "周末前推送效果略好。配合大促/节日活动触达，以利益点驱动回流。不建议频繁推送。", color: "#EF4444" },
  ],
  history: [
    { date: "2026-05-25", campaign: "新功能内测邀请", segment: "重度用户", sent: 2230, opened: 826, ctr: 28.4, conversion: 12.1 },
    { date: "2026-05-24", campaign: "周末限时优惠", segment: "普通用户", sent: 5560, opened: 1223, ctr: 15.2, conversion: 6.8 },
    { date: "2026-05-23", campaign: "我们很想你", segment: "流失风险", sent: 3090, opened: 278, ctr: 5.8, conversion: 1.2 },
    { date: "2026-05-20", campaign: "VIP 权益升级通知", segment: "重度用户", sent: 2230, opened: 915, ctr: 35.2, conversion: 18.5 },
    { date: "2026-05-19", campaign: "使用技巧推送", segment: "普通用户", sent: 5560, opened: 1334, ctr: 16.8, conversion: 7.2 },
    { date: "2026-05-15", campaign: "节日大促活动", segment: "已流失", sent: 1490, opened: 89, ctr: 3.2, conversion: 0.8 },
  ],
};

export function PushStrategy() {
  const [data, setData] = useState<StrategyData | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = getItem<StrategyData | null>("pushStrategy", null);
    if (saved?.strategies?.length) {
      setData(saved);
      setIsDemoData(false);
    }
    setLoaded(true);
  }, []);

  function buildRealContext(): { segments: string; historical: string } {
    const metrics = getUploadedMetrics();
    const feedback = getFeedbackHistory();
    const activities = getActivities();
    const experiments = getExperiments();

    const parts: string[] = [];

    // 1. Real metric data → user behavior patterns
    if (metrics.length > 0) {
      parts.push("## 真实指标数据");
      metrics.forEach((m) => {
        const lastVals = m.values.slice(-7);
        const avg = lastVals.length > 0 ? (lastVals.reduce((a, b) => a + b, 0) / lastVals.length).toFixed(0) : "N/A";
        const trend = lastVals.length >= 2
          ? lastVals[lastVals.length - 1] > lastVals[0] ? "上升" : "下降"
          : "持平";
        parts.push(`- ${m.label}：近7日均值 ${avg}，趋势 ${trend}（${m.dates.slice(-7).join("~")}）`);
      });
    }

    // 2. Real feedback → user sentiment & pain points
    if (feedback.length > 0) {
      parts.push("\n## 用户反馈摘要");
      const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
      feedback.forEach((f) => { sentimentCounts[f.sentiment]++; });
      parts.push(`- 共 ${feedback.length} 条反馈：正面 ${sentimentCounts.positive}，中性 ${sentimentCounts.neutral}，负面 ${sentimentCounts.negative}`);
      const negativeItems = feedback.filter((f) => f.sentiment === "negative").slice(0, 3);
      if (negativeItems.length > 0) {
        parts.push("- 用户主要负面反馈：");
        negativeItems.forEach((f) => parts.push(`  - ${f.title}：${f.feedbackText?.slice(0, 80) || f.quote?.slice(0, 80)}`));
      }
    }

    // 3. Real activities → historical push performance
    if (activities.length > 0) {
      parts.push("\n## 历史活动数据");
      activities.slice(0, 5).forEach((a) => {
        parts.push(`- ${a.name}（${a.startDate}~${a.endDate}）：目标用户 ${a.targetAudience || "未知"}，点击率 ${(a.clickRate * 100).toFixed(1)}%，转化率 ${(a.conversionRate * 100).toFixed(1)}%`);
      });
    }

    // 4. Real experiments → validated insights
    if (experiments.length > 0) {
      const finished = experiments.filter((e) => e.status === "ended");
      if (finished.length > 0) {
        parts.push("\n## A/B 实验结论");
        finished.slice(0, 3).forEach((e) => {
          parts.push(`- ${e.name}：${e.goalMetric}，实验组提升 ${((e.lift ?? 0) * 100).toFixed(1)}%，结论 ${e.conclusion || "未记录"}`);
        });
      }
    }

    // If no real data at all, provide a note
    if (parts.length === 0) {
      parts.push('## 注意\n尚无真实产品数据，请基于行业通用的用户分群和推送最佳实践生成策略，所有推荐需标注置信度为"低"。');
    }

    return {
      segments: parts.join("\n"),
      historical: activities.length > 0
        ? activities.slice(0, 5).map((a) =>
            `- ${a.name}：${a.targetAudience || "全量"}，点击率 ${(a.clickRate * 100).toFixed(1)}%，转化率 ${(a.conversionRate * 100).toFixed(1)}%`
          ).join("\n")
        : "",
    };
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    const { segments, historical } = buildRealContext();
    try {
      const res = await fetch("/api/push-strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: getUserApiKey() || '',
          segments,
          historicalContext: historical || undefined,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.strategies?.length) {
          const newData: StrategyData = { strategies: result.strategies, history: result.history || [] };
          setData(newData);
          setItem("pushStrategy", newData);
          setIsDemoData(false);
          setIsGenerating(false);
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || `请求失败 (${res.status})`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "生成失败，请检查 API 配置");
    }
    setIsGenerating(false);
  };

  const handleUseDemo = () => {
    setData(DEFAULT_STRATEGIES);
    setIsDemoData(true);
    setError(null);
  };

  if (!loaded) return null;

  const strategies = data?.strategies || [];
  const history = data?.history || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Generate Bar */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl"
        >
          {isGenerating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成策略...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />{data ? "重新生成策略" : "AI 生成推送策略"}</>
          )}
        </Button>
        {isDemoData && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3 max-w-xl">
          <div className="text-sm text-red-700 flex-1">
            <p className="font-medium mb-1">AI 生成失败</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleUseDemo}
            className="rounded-lg border-red-200 text-red-600 hover:bg-red-100 text-xs shrink-0"
          >
            使用演示数据
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!data && !error && !isGenerating && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center max-w-xl">
          <Target className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">点击上方按钮，AI 生成推送策略</p>
          <p className="text-gray-400 text-xs">基于用户分群特征，自动推荐最佳推送时间、渠道、频率</p>
        </div>
      )}

      {/* Strategy Cards */}
      {strategies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-sm text-gray-900">分群推送策略</h3>
          </div>
          {strategies.map((strategy, i) => (
            <div
              key={strategy.segment}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-200"
              style={{ borderLeft: `3px solid ${strategy.color}` }}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: strategy.color }}
                >
                  {strategy.segment[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{strategy.segment}</h4>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{strategy.bestTime}</span>
                    <span>{strategy.frequency}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-gray-900">{strategy.expectedOpenRate}</div>
                  <div className="text-[10px] text-gray-400">预计打开率</div>
                </div>
                {expandedIndex === i ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
                )}
              </button>
              {expandedIndex === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3 ml-12">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">最佳渠道</span>
                      <p className="text-sm text-gray-700 mt-1">{strategy.bestChannel}</p>
                      {strategy.channelBasis && (
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">依据：{strategy.channelBasis}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">推送频率</span>
                      <p className="text-sm text-gray-700 mt-1">{strategy.frequency}</p>
                      {strategy.frequencyBasis && (
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">依据：{strategy.frequencyBasis}</p>
                      )}
                    </div>
                  </div>
                  {/* Time basis */}
                  {strategy.timeBasis && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">推荐时间依据</span>
                        <p className="text-xs text-blue-800 mt-0.5">{strategy.timeBasis}</p>
                      </div>
                    </div>
                  )}
                  {/* Confidence + Data range */}
                  <div className="flex items-center gap-3">
                    {strategy.confidence && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        strategy.confidence === "高" ? "bg-emerald-100 text-emerald-700" :
                        strategy.confidence === "中" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        置信度：{strategy.confidence}
                      </span>
                    )}
                    {strategy.dataRange && (
                      <span className="text-[10px] text-gray-400">数据范围：{strategy.dataRange}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">运营建议</span>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{strategy.notes}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-sm text-gray-900">历史推送效果</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-medium text-gray-400 px-4 py-3">日期</th>
                  <th className="text-left font-medium text-gray-400 px-4 py-3">活动</th>
                  <th className="text-left font-medium text-gray-400 px-4 py-3">目标群</th>
                  <th className="text-right font-medium text-gray-400 px-4 py-3">发送</th>
                  <th className="text-right font-medium text-gray-400 px-4 py-3">打开</th>
                  <th className="text-right font-medium text-gray-400 px-4 py-3">打开率</th>
                  <th className="text-right font-medium text-gray-400 px-4 py-3">转化率</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{h.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{h.campaign}</td>
                    <td className="px-4 py-3 text-gray-500">{h.segment}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{h.sent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{h.opened.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${h.ctr > 10 ? "text-emerald-600" : "text-amber-600"}`}>
                        {h.ctr}%
                        {h.ctr > 10 ? <TrendingUp className="w-3 h-3 inline ml-0.5" /> : <TrendingDown className="w-3 h-3 inline ml-0.5" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${h.conversion > 5 ? "text-emerald-600" : "text-gray-500"}`}>
                        {h.conversion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
