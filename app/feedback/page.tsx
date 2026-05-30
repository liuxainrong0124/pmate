"use client";

import { useState } from "react";
import { FeedbackInput } from "@/components/feedback/feedback-input";
import { FeedbackReportDisplay } from "@/components/feedback/feedback-report";
import { FeedbackReport } from "@/types";
import { ExportButton } from "@/components/shared/export-button";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { getUserApiKey,  addFeedbackHistory } from "@/lib/store/local-store";
import { MessageSquare, Sparkles } from "lucide-react";

function deriveSentiment(report: FeedbackReport): "positive" | "neutral" | "negative" {
  const posCount = report.insights.filter(i => i.sentimentTrend === "rising").length;
  const negCount = report.insights.filter(i => i.sentimentTrend === "declining").length;
  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

const catLabels: Record<string, string> = {
  bug:"Bug", feature_request:"功能需求", ux:"体验问题", support:"咨询", other:"其他",
};

export default function FeedbackPage() {
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch("/api/feedback/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '', feedbackText: text }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "分析失败"); }
      const data = await res.json();
      setReport(data.report);

      // Store in history for aggregation
      const sent = deriveSentiment(data.report);
      const firstInsight = data.report.insights?.[0];
      addFeedbackHistory({
        id: `fb-${Date.now()}`,
        title: firstInsight?.title || "用户反馈",
        feedbackText: text.slice(0, 200),
        sentiment: sent,
        quote: firstInsight?.quotes?.[0] || text.slice(0, 80),
        category: catLabels[firstInsight?.category] || "其他",
        source: "手动输入",
        date: new Date().toISOString().slice(0, 10),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "分析失败");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-teal-200/60 dark:from-teal-500/15 to-transparent pointer-events-none" />
      <ScrollReveal>
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">用户反馈分析</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">粘贴原始反馈，AI 自动分类、洞察、排优先级</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-6 shadow-sm mb-6">
          <FeedbackInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </ScrollReveal>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-500/20">{error}</div>
      )}

      {!report && !isLoading && (
        <ScrollReveal delay={200}>
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-10 text-center">
            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">粘贴反馈内容，点击分析</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">支持 App Store 评论、用户访谈、问卷等多格式</p>
          </div>
        </ScrollReveal>
      )}

      {report && (
        <ScrollReveal>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">分析报告</h2>
            <ExportButton data={report} type="feedback" filename={`feedback-report-${Date.now()}`} label="导出" />
          </div>
          <FeedbackReportDisplay report={report} />
        </ScrollReveal>
      )}
    </div>
  );
}
