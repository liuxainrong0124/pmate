"use client";

import { useState } from "react";
import { CompetitorInput } from "@/components/competitor/competitor-input";
import { CompetitorReportDisplay } from "@/components/competitor/competitor-report";
import { CompetitorNews } from "@/components/competitor/competitor-news";
import { CompetitorReport as CompetitorReportType } from "@/types";
import { getUserApiKey, addCompetitorAnalysis } from "@/lib/store/local-store";
import { ExportButton } from "@/components/shared/export-button";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { TrendingUp, Sparkles, AlertTriangle } from "lucide-react";

export default function CompetitorPage() {
  const [report, setReport] = useState<CompetitorReportType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCompetitors, setLastCompetitors] = useState<string>("");

  const handleSubmit = async (competitors: string, context?: string) => {
    setIsLoading(true);
    setError(null);
    setLastCompetitors(competitors);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/competitor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '', competitors, context }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      if (!data.report) {
        throw new Error("AI 返回数据为空，请重试");
      }

      console.log("Competitor report received:", Object.keys(data.report));
      setReport(data.report);

      // Track the analysis for notifications
      try {
        const threats = data.report?.competitors?.reduce((sum: number, c: { threats?: unknown[] }) => sum + (Array.isArray(c.threats) ? c.threats.length : 0), 0) || 0;
        const opportunities = data.report?.competitors?.reduce((sum: number, c: { opportunities?: unknown[] }) => sum + (Array.isArray(c.opportunities) ? c.opportunities.length : 0), 0) || 0;
        addCompetitorAnalysis({
          competitors,
          summary: data.report?.summary || "",
          threats,
          opportunities,
        });
      } catch { /* tracking failure is non-critical */ }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("分析超时（60秒），请检查网络后重试");
      } else {
        const msg = err instanceof Error ? err.message : "分析失败";
        console.error("Competitor analysis error:", err);
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-red-200/60 dark:from-red-500/15 to-transparent pointer-events-none" />
      <ScrollReveal>
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">竞品动态追踪</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">输入竞品名称，AI 生成竞争格局分析报告</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 shadow-sm mb-6">
          <CompetitorInput onSubmit={handleSubmit} isLoading={isLoading} onCompetitorsChange={setLastCompetitors} />
        </div>
      </ScrollReveal>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">分析失败</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-amber-700 font-medium">AI 正在分析中...</p>
          <p className="text-xs text-amber-500 mt-1">正在调用 DeepSeek 生成竞品分析，约需 10-20 秒</p>
        </div>
      )}

      {!report && !isLoading && (
        <>
          <ScrollReveal delay={200}>
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-10 text-center">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">输入竞品名称，开始分析</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">AI 将生成竞品画像、维度对比、SWOT 分析及行动建议</p>
            </div>
          </ScrollReveal>
          {lastCompetitors && (
            <div className="mt-8">
              <ScrollReveal direction="none" delay={100}>
                <CompetitorNews competitors={lastCompetitors} />
              </ScrollReveal>
            </div>
          )}
        </>
      )}

      {report && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">分析报告</h2>
            <ExportButton data={report} type="competitor" filename={`competitor-report-${Date.now()}`} label="导出" />
          </div>
          {/* Debug: show raw report structure */}
          <details className="mb-4">
            <summary className="text-xs text-gray-400 cursor-pointer">调试信息 (点击展开)</summary>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-1 overflow-auto max-h-60">{JSON.stringify(report, null, 2)}</pre>
          </details>
          <ScrollReveal direction="none">
            <CompetitorReportDisplay report={report} />
          </ScrollReveal>

          {/* Competitor News Auto-Fetch */}
          {lastCompetitors && (
            <div className="mt-8">
              <ScrollReveal direction="none" delay={100}>
                <CompetitorNews competitors={lastCompetitors} />
              </ScrollReveal>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
