"use client";

import { useState } from "react";
import { CompetitorInput } from "@/components/competitor/competitor-input";
import { CompetitorReportDisplay } from "@/components/competitor/competitor-report";
import { CompetitorReport as CompetitorReportType } from "@/types";
import { getUserApiKey } from "@/lib/store/local-store";
import { ExportButton } from "@/components/shared/export-button";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { TrendingUp, Sparkles } from "lucide-react";

export default function CompetitorPage() {
  const [report, setReport] = useState<CompetitorReportType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (competitors: string, context?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/competitor/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '', competitors, context }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析失败");
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "分析失败");
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
          <CompetitorInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </ScrollReveal>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">{error}</div>
      )}

      {!report && !isLoading && (
        <ScrollReveal delay={200}>
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-10 text-center">
            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">输入竞品名称，开始分析</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">AI 将生成竞品画像、维度对比、SWOT 分析及行动建议</p>
          </div>
        </ScrollReveal>
      )}

      {report && (
        <ScrollReveal>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">分析报告</h2>
            <ExportButton data={report} type="competitor" filename={`competitor-report-${Date.now()}`} label="导出" />
          </div>
          <CompetitorReportDisplay report={report} />
        </ScrollReveal>
      )}
    </div>
  );
}
