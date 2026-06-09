"use client";

import { useState, useMemo } from "react";
import { MetricWithHistory } from "@/lib/mock/metrics-data";
import { getPoolRequirements, getObjectives, getSettings } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { FileText, Download, Calendar, TrendingUp, TrendingDown, Users, Target, Copy } from "lucide-react";

interface ReportSection {
  title: string;
  content: string;
}

export function ReportGenerator({ metrics }: { metrics: MetricWithHistory[] }) {
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [generated, setGenerated] = useState(false);

  const report = useMemo(() => {
    const settings = getSettings();
    const requirements = getPoolRequirements();
    const objectives = getObjectives();
    const dateStr = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });

    const sections: ReportSection[] = [];

    // Header
    const period = reportType === "weekly" ? "周报" : "月报";
    sections.push({
      title: "概览",
      content: `${settings.userName || "Pulse 用户"} · ${dateStr}\n\n本${period}涵盖 ${requirements.length} 条需求、${objectives.length} 个 OKR 目标、${metrics.length} 个数据指标。`,
    });

    // Metrics summary
    let metricsText = "";
    for (const m of metrics) {
      const trend = m.trend === "up" ? "↑" : "↓";
      metricsText += `- ${m.label}: ${m.currentValue} (${trend}${m.change > 0 ? "+" : ""}${m.change}%)\n`;
    }
    sections.push({ title: "关键指标", content: metricsText });

    // Requirement status
    const statusCount: Record<string, number> = {};
    for (const r of requirements) {
      statusCount[r.status] = (statusCount[r.status] || 0) + 1;
    }
    let reqText = `需求总数: ${requirements.length}\n`;
    const statusLabels: Record<string, string> = { planning: "待评审", in_progress: "开发中", review: "测试中", done: "已上线", backlog: "已拒绝" };
    for (const [s, c] of Object.entries(statusCount)) {
      reqText += `- ${statusLabels[s] || s}: ${c} 条\n`;
    }
    const completed = requirements.filter(r => r.status === "done");
    if (completed.length > 0) {
      reqText += `\n本周完成: ${completed.map(r => r.title).join("、")}`;
    }
    sections.push({ title: "需求进展", content: reqText });

    // OKR progress
    if (objectives.length > 0) {
      let okrText = "";
      for (const obj of objectives.filter(o => o.status === "active")) {
        okrText += `- ${obj.title}: ${obj.progress}%\n`;
      }
      sections.push({ title: "OKR 进度", content: okrText || "暂无活跃目标" });
    }

    // Risks / anomalies
    const downMetrics = metrics.filter(m => m.trend === "down" && Math.abs(m.change) > 3);
    if (downMetrics.length > 0) {
      let riskText = "以下指标出现明显下降:\n";
      for (const m of downMetrics) {
        riskText += `- ⚠️ ${m.label}: ${m.change}%\n`;
      }
      sections.push({ title: "风险与关注", content: riskText });
    }

    return { sections, period, dateStr };
  }, [metrics, reportType]);

  const reportText = useMemo(() => {
    return report.sections.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
  }, [report]);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    showToast("已复制到剪贴板", "success");
  };

  const handleExport = () => {
    const blob = new Blob([reportText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Pulse_${report.period}_${report.dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("报告已导出", "success");
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">报告生成</h3>
          <p className="text-xs text-gray-400 mt-0.5">自动汇总指标、需求、OKR 数据</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={reportType}
            onChange={(e) => { setReportType(e.target.value as "weekly" | "monthly"); setGenerated(false); }}
            className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="weekly">周报</option>
            <option value="monthly">月报</option>
          </select>
          <button
            onClick={() => setGenerated(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <FileText className="w-4 h-4" />
            生成报告
          </button>
        </div>
      </div>

      {generated && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{report.period} · {report.dateStr}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="复制">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={handleExport} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="导出 Markdown">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-5 max-h-[500px] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {report.sections.map((s, i) => (
                <div key={i} className="mb-5 last:mb-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{s.title}</h4>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{s.content}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
