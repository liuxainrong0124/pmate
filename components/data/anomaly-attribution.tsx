"use client";

import { useState } from "react";
import { mockAnomalies, AnomalyEvent, MetricWithHistory } from "@/lib/mock/metrics-data";
import { getUserApiKey } from "@/lib/store/local-store";
import Link from "next/link";
import {
  AlertTriangle, TrendingDown, ArrowRight, Lightbulb, ChevronDown,
  ChevronUp, FileText, Sparkles, Loader2, Target, Gauge, Link2,
} from "lucide-react";

interface AnalysisResult {
  summary: string;
  rootCauses: { cause: string; confidence: number; evidence: string; category: string }[];
  correlatedMetrics: string[];
  impact: { severity: string; affectedSegments: string[]; trendPrediction: string };
  actions: { action: string; effort: string; expectedImpact: string }[];
}

const categoryColors: Record<string, string> = {
  "产品变更": "bg-blue-100 text-blue-700",
  "市场环境": "bg-purple-100 text-purple-700",
  "用户行为": "bg-green-100 text-green-700",
  "技术问题": "bg-orange-100 text-orange-700",
  "季节性": "bg-cyan-100 text-cyan-700",
  "竞品": "bg-red-100 text-red-700",
  "未知": "bg-gray-100 text-gray-600",
};

const effortLabels: Record<string, string> = { low: "低", medium: "中", high: "高" };
const effortColors: Record<string, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export function AnomalyAttribution() {
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<Record<number, AnalysisResult>>({});
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAiAnalyze = async (index: number, event: AnomalyEvent) => {
    setAnalyzingId(index);
    setError(null);
    try {
      const res = await fetch("/api/anomaly/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: getUserApiKey() || "",
          metric: event.metric,
          change: event.change,
          date: event.date,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || "分析失败");
      }
      const data = await res.json();
      if (data.analysis) {
        setAnalyses((prev) => ({ ...prev, [index]: data.analysis }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "请求失败";
      setError(msg);
    }
    setAnalyzingId(null);
  };

  const severityBadge = (s: string) => {
    if (s === "高") return "bg-red-100 text-red-700";
    if (s === "中") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white dark:from-amber-500/5 dark:to-transparent p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1">自动异动监控</h3>
          <p className="text-sm text-amber-700 dark:text-amber-500">
            Pulse 持续监控核心指标，自动检测异常波动并 AI 归因分析。当前监控：DAU、次日留存、推送打开率、LTV、转化率、流失率。
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            检测到的异动
            <span className="text-xs text-gray-400 font-normal">{mockAnomalies.length} 条</span>
          </h3>
        </div>

        {mockAnomalies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white/50 p-10 text-center">
            <Gauge className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">当前未检测到异常</p>
            <p className="text-xs text-gray-400 mt-1">接入真实数据源后将自动监控</p>
          </div>
        ) : (
          mockAnomalies.map((event, i) => (
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
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${event.confidence * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{(event.confidence * 100).toFixed(0)}%</span>
                  </div>
                  {expandedId === i ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {expandedId === i && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-50 dark:border-gray-800 pt-3 ml-12">
                  {/* AI Analyze button */}
                  {!analyses[i] && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAiAnalyze(i, event); }}
                        disabled={analyzingId === i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-medium transition-colors"
                      >
                        {analyzingId === i ? (
                          <><Loader2 className="w-3 h-3 animate-spin" />AI 归因分析中...</>
                        ) : (
                          <><Sparkles className="w-3 h-3" />AI 深度归因分析</>
                        )}
                      </button>
                      <span className="text-[10px] text-gray-400">分析根因、关联指标和行动建议</span>
                    </div>
                  )}

                  {/* Analysis Result */}
                  {analyses[i] && (
                    <div className="space-y-3">
                      {/* Summary */}
                      <div className="flex items-start gap-2 text-sm bg-violet-50 rounded-lg p-3">
                        <Lightbulb className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                        <p className="text-violet-800">{analyses[i].summary}</p>
                      </div>

                      {/* Root Causes */}
                      {(analyses[i].rootCauses?.length ?? 0) > 0 && (
                        <div>
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">根因分析 (按置信度排序)</span>
                          <div className="mt-2 space-y-2">
                            {analyses[i].rootCauses.map((rc, j) => (
                              <div key={j} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-bold text-gray-900">#{j + 1}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColors[rc.category] || categoryColors["未知"]}`}>
                                    {rc.category}
                                  </span>
                                  <span className="ml-auto text-[10px] font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                                    置信度 {(rc.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 font-medium">{rc.cause}</p>
                                {rc.evidence && <p className="text-xs text-gray-500 mt-1">{rc.evidence}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Correlated Metrics */}
                      {(analyses[i].correlatedMetrics?.length ?? 0) > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <Link2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-500">关联指标：</span>
                          {analyses[i].correlatedMetrics.map((m, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{m}</span>
                          ))}
                        </div>
                      )}

                      {/* Impact */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Target className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400">严重程度</span>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityBadge(analyses[i].impact.severity)}`}>
                            {analyses[i].impact.severity}
                          </span>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingDown className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-400">趋势预判</span>
                          </div>
                          <p className="text-xs text-gray-700">{analyses[i].impact.trendPrediction}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {(analyses[i].actions?.length ?? 0) > 0 && (
                        <div>
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">建议行动</span>
                          <div className="mt-2 space-y-1.5">
                            {analyses[i].actions.map((a, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs">
                                <span className={`shrink-0 px-1.5 py-0.5 rounded-full border text-[10px] ${effortColors[a.effort] || effortColors.medium}`}>
                                  {effortLabels[a.effort] || "中"}
                                </span>
                                <span className="text-gray-700">{a.action}</span>
                                <span className="text-gray-400 ml-auto text-[10px]">{a.expectedImpact}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Create requirement button */}
                      <Link
                        href={`/requirements?tab=prd&from=anomaly&title=${encodeURIComponent(event.metric + "异动修复")}&description=${encodeURIComponent(analyses[i].rootCauses[0]?.cause || "")}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        创建修复需求单
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {/* Fallback: no analysis yet and show old possible causes */}
                  {!analyses[i] && event.possibleCauses.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3" /> 初步推测
                      </span>
                      <ul className="mt-2 space-y-2">
                        {event.possibleCauses.map((cause, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
