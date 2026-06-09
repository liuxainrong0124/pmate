"use client";

import { useState } from "react";
import { MetricWithHistory } from "@/lib/mock/metrics-data";
import { getUserApiKey } from "@/lib/store/local-store";
import { Send, Loader2, Sparkles, TrendingUp, TrendingDown, BarChart3, X } from "lucide-react";

interface QueryResult {
  answer: string;
  analysis: string;
  suggestion: string;
  relatedMetric: string;
  chartType: "line" | "bar" | "none";
}

const EXAMPLE_QUESTIONS = [
  "最近7天DAU趋势怎么样？",
  "为什么留存率下降了？",
  "推送打开率相比上月有提升吗？",
  "哪个指标波动最大？",
  "LTV 的未来趋势预测",
];

function getDemoAnswer(q: string): QueryResult {
  const demoData: Record<string, QueryResult> = {
    "最近7天DAU趋势怎么样？": {
      answer: "最近7天DAU整体呈上升趋势，日均活跃用户从 11,200 增长至 12,800，环比增长 3.2%。",
      analysis: "增长主要受益于新版本推送触达（+800 日活）和周末自然流量高峰。周三出现小幅回落（-200），属于正常工作日波动。核心增长引擎来自新用户注册量提升，但老用户回访率基本持平。",
      suggestion: "建议继续观察周末后的回落幅度。如果下周一 DAU 能保持在 12,000 以上，说明增长是可持续的，可考虑加大新版本推送力度。",
      relatedMetric: "DAU",
      chartType: "line",
    },
    "为什么留存率下降了？": {
      answer: "次日留存率从上周的 42% 下降至本周的 38%，降幅约 4 个百分点，需要关注。",
      analysis: "最可能的原因有两个：1）新版本首次加载时间增加了约 0.8 秒（置信度 87%），导致新用户首日体验变差；2）新手引导流程中移除了关键的功能介绍步骤（置信度 72%），新用户不知道核心功能在哪。另外竞品同期上线了类似功能，可能造成部分用户分流。",
      suggestion: "优先优化首屏加载速度，将核心资源做预加载。同时在新手引导中恢复功能介绍步骤。建议在下个迭代安排性能专项优化，目标将首次加载时间压缩到 1.5 秒以内。",
      relatedMetric: "次日留存",
      chartType: "line",
    },
    "推送打开率相比上月有提升吗？": {
      answer: "推送打开率从 24.5% 提升至 28.2%，环比增长 3.7 个百分点，有明显改善。",
      analysis: "提升的主要原因是优化了推送发送时间——根据用户分组实现了分时段精准推送。重度用户的打开率从 32% 提升到 38%，普通用户从 18% 提升到 24%。流失风险用户群的打开率仍然偏低（8%），说明内容吸引力对这部分用户仍然不足。",
      suggestion: "当前策略在重度用户和普通用户群效果显著，建议保持。对流失风险用户，建议测试情感向和利益向内容的混合推送策略，尝试将打开率提升至 12% 以上。",
      relatedMetric: "推送打开率",
      chartType: "bar",
    },
    "哪个指标波动最大？": {
      answer: "在所有指标中，推送打开率波动最大，过去 7 天标准差为 5.2 个百分点。",
      analysis: "推送打开率最高达到 32%（周四），最低跌至 18%（周六），波动幅度达 14 个百分点。相比之下，DAU 的波动较为平稳（标准差 1.8%），留存率波动中等（标准差 2.5%）。推送打开率的波动与推送内容类型强相关——功能更新类推送打开率最高，促销类推送打开率最低。",
      suggestion: "波动大不一定是坏事，说明推送效果对内容类型敏感。建议建立推送内容的 A/B 测试机制，系统性地找出最适合各用户群的推送内容类型和发送时间。",
      relatedMetric: "推送打开率",
      chartType: "line",
    },
    "LTV 的未来趋势预测": {
      answer: "基于过去 30 天数据，LTV 预计在未来 7 天增长至 ¥30.2，较当前 ¥28.5 提升约 6%。",
      analysis: "LTV 当前月均增长 2%，增长的驱动力来自付费用户占比提升（从 8% 到 9.5%）和客单价微涨（¥45 → ¥48）。根据线性回归预测，如果保持当前增长斜率，7 天后 LTV 预计达到 ¥30.2，30 天后预计达到 ¥34.8。但预测置信度为中等（R²=0.72），实际值可能受到付费活动和新用户质量的影响。",
      suggestion: "LTV 的增长趋势利好，但 R² 仅 0.72 说明预测不确定性较大。建议：1）加大高价值用户的运营投入以稳固 LTV 增长；2）关注新用户首周付费转化，这是 LTV 的前置指标；3）2 周后重新校准预测模型。",
      relatedMetric: "LTV",
      chartType: "line",
    },
  };
  return demoData[q] || {
    answer: "这是一个示例回答。请配置 DeepSeek API Key 后获得针对你数据的实时分析。",
    analysis: "当前显示的是演示数据。配置 API Key 后，AI 将基于你上传的真实数据进行分析，包括趋势变化、根因分析、关联指标和具体行动建议。",
    suggestion: "前往 设置 → AI 配置 → 输入 DeepSeek API Key，即可解锁实时 AI 分析。",
    relatedMetric: "未知",
    chartType: "none",
  };
}

export function NLQuery({ metrics }: { metrics: MetricWithHistory[] }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [history, setHistory] = useState<{ q: string; r: QueryResult }[]>([]);

  const handleQuery = async (q?: string) => {
    const query = q || question.trim();
    if (!query) return;

    const apiKey = getUserApiKey();
    if (!apiKey) {
      const demo = getDemoAnswer(query);
      setResult(demo);
      setIsDemo(true);
      setHistory(prev => [{ q: query, r: demo }, ...prev].slice(0, 10));
      setQuestion("");
      return;
    }

    setLoading(true);
    setResult(null);
    setIsDemo(false);

    try {
      const metricData = metrics.map(m => ({
        label: m.label,
        value: m.currentValue,
        change: m.change,
        trend: m.trend,
        unit: m.unit,
        history: m.history.slice(-14),
      }));

      const res = await fetch("/api/data-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, question: query, metrics: metricData }),
      });

      if (!res.ok) throw new Error("查询失败");
      const data = await res.json();
      setResult(data.result);
      setHistory(prev => [{ q: query, r: data.result }, ...prev].slice(0, 10));
      setQuestion("");
    } catch {
      const demo = getDemoAnswer(query);
      setResult(demo);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Query input */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">自然语言数据查询</h3>
          <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">AI</span>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuery(); }}
            placeholder="输入问题，如：最近7天DAU趋势怎么样？"
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            查询
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUESTIONS.map((eq, i) => (
            <button
              key={i}
              onClick={() => { setQuestion(eq); handleQuery(eq); }}
              className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 px-2.5 py-1 rounded-lg transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {(loading || result) && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 animate-fade-in">
          {loading ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              <span className="text-sm text-gray-500">AI 正在分析数据...</span>
            </div>
          ) : result && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className={`w-5 h-5 mt-0.5 shrink-0 ${isDemo ? "text-amber-500" : "text-violet-500"}`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.answer}</p>
                    {isDemo && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-medium shrink-0">演示</span>
                    )}
                  </div>
                  {result.analysis && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{result.analysis}</p>
                  )}
                  {result.suggestion && (
                    <div className="mt-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 p-3">
                      <p className="text-xs text-violet-700 dark:text-violet-400">{result.suggestion}</p>
                    </div>
                  )}
                  {result.relatedMetric && (
                    <div className="flex items-center gap-1.5 mt-3">
                      <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-400">相关指标: {result.relatedMetric}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query history */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-xs font-medium text-gray-500">查询历史</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuestion(h.q); handleQuery(h.q); }}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{h.q}</p>
                <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{h.r.answer}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
