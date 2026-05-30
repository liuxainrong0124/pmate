"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, BarChart3, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Target, Sparkles, Loader2 } from "lucide-react";
import { getUserApiKey,  getItem, setItem } from "@/lib/store/local-store";

interface StrategyItem {
  segment: string;
  bestTime: string;
  bestChannel: string;
  frequency: string;
  expectedOpenRate: string;
  notes: string;
  color: string;
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/push-strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '',
          segments: "重度用户（18%，高活跃高付费）、普通用户（45%，中等活跃）、流失风险用户（25%，活跃下降）、已流失用户（12%，30天未活跃）",
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
                    </div>
                    <div>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">推送频率</span>
                      <p className="text-sm text-gray-700 mt-1">{strategy.frequency}</p>
                    </div>
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
