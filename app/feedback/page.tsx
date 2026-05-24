"use client";

import { useState } from "react";
import { FeedbackInput } from "@/components/feedback/feedback-input";
import { FeedbackReportDisplay } from "@/components/feedback/feedback-report";
import { FeedbackReport } from "@/types";
import { ExportButton } from "@/components/shared/export-button";

export default function FeedbackPage() {
  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackText: text }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析失败");
      }
      const data = await res.json();
      setReport(data.report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">用户反馈分析</h1>
      <p className="text-gray-500 mb-6">
        粘贴用户反馈，AI 自动分类、提取关键洞察并给出行动建议
      </p>

      <FeedbackInput onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {report && (
        <>
          <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="text-lg font-semibold">分析报告</h2>
            <ExportButton
              content={JSON.stringify(report, null, 2)}
              filename={`feedback-report-${Date.now()}.json`}
              label="导出JSON"
            />
          </div>
          <FeedbackReportDisplay report={report} />
        </>
      )}
    </div>
  );
}
