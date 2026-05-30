"use client";

import { useState } from "react";
import { mockAnomalies, AnomalyEvent } from "@/lib/mock/metrics-data";
import { getUserApiKey } from "@/lib/store/local-store";
import Link from "next/link";
import { AlertTriangle, TrendingDown, ArrowRight, Lightbulb, ChevronDown, ChevronUp, FileText, Sparkles, Loader2 } from "lucide-react";

export function AnomalyAttribution() {
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCauses, setAiCauses] = useState<Record<number, string[]>>({});
  const [analyzedIds, setAnalyzedIds] = useState<Set<number>>(new Set());

  const handleAiAnalyze = async (index: number, event: AnomalyEvent) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/anomaly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: getUserApiKey() || "",
          featureName: `${event.metric}异动分析`,
          description: `${event.date} ${event.metric}出现${event.change}的异常变化，置信度：${(event.confidence * 100).toFixed(0)}%`
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scenarios?.length) {
          const causes = data.scenarios.slice(0, 4).map((s: { title: string; suggestion: string }) =>
            `${s.title}：${s.suggestion}`
          );
          setAiCauses((prev) => ({ ...prev, [index]: causes }));
          setAnalyzedIds((prev) => new Set(prev).add(index));
        }
      }
    } catch {
      // Fall back to mock data silently
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/5 dark:to-transparent p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">自动异动监控</h3>
          <p className="text-sm text-amber-700 dark:text-amber-500">
            Pulse 持续监控核心指标，自动检测异常波动并分析可能原因。当前监控指标：DAU、次日留存、推送打开率、LTV、转化率、流失率。
          </p>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            检测到的异动
            <span className="text-xs text-gray-400 font-normal">{mockAnomalies.length} 条</span>
          </h3>
        </div>
        {mockAnomalies.map((event, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden transition-all duration-200">
            <button
              onClick={() => setExpandedId(expandedId === i ? null : i)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400">{event.date}</span>
                  <span className="text-xs font-medium text-red-500">{event.change}</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.metric} 异动</h4>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${event.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{(event.confidence * 100).toFixed(0)}%</span>
                </div>
                {expandedId === i ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>
            {expandedId === i && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-gray-800 pt-3 ml-12">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3" /> 可能原因
                    </span>
                    {!analyzedIds.has(i) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAiAnalyze(i, event); }}
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 hover:text-violet-700 transition-colors"
                      >
                        {isAnalyzing ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />分析中</>
                        ) : (
                          <><Sparkles className="w-3 h-3" />AI 分析</>
                        )}
                      </button>
                    )}
                  </div>
                  <ul className="mt-2 space-y-2">
                    {(aiCauses[i] || event.possibleCauses).map((cause, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/requirements?tab=prd&from=anomaly&title=${encodeURIComponent(event.metric + "异动修复")}&description=${encodeURIComponent(event.possibleCauses[0] || "")}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    创建修复需求单
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Placeholder */}
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">接入真实数据源后，异动检测将自动运行</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          支持每日定时检测 + 阈值告警通知。当前展示模拟分析结果。点击「AI 分析」获取实时归因。
        </p>
      </div>
    </div>
  );
}
