"use client";

import { useRouter } from "next/navigation";
import { FeedbackReport as FeedbackReportType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ListChecks, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowRight } from "lucide-react";

interface FeedbackReportProps { report: FeedbackReportType; }

const sevCfg: Record<string, { clr: string; lbl: string; dot: string }> = {
  high:   { clr: "bg-red-50 text-red-700 border-red-200", lbl: "高优", dot: "bg-red-500" },
  medium: { clr: "bg-amber-50 text-amber-700 border-amber-200", lbl: "中优", dot: "bg-amber-500" },
  low:    { clr: "bg-emerald-50 text-emerald-700 border-emerald-200", lbl: "低优", dot: "bg-emerald-500" },
};
const catLabels: Record<string, string> = {
  bug:"Bug", feature_request:"功能需求", ux:"体验问题", support:"咨询", other:"其他",
};
const trendIcons: Record<string, React.ReactNode> = {
  rising: <TrendingUp className="w-3 h-3 text-red-500" />,
  stable: <Minus className="w-3 h-3 text-gray-400" />,
  declining: <TrendingDown className="w-3 h-3 text-emerald-500" />,
};
const trendLabels: Record<string, string> = {
  rising: "情绪上升", stable: "情绪平稳", declining: "情绪下降",
};

function getScoreColor(score: number): string {
  if (score >= 8) return "text-red-600";
  if (score >= 5) return "text-amber-600";
  return "text-emerald-600";
}

export function FeedbackReportDisplay({ report }: FeedbackReportProps) {
  const router = useRouter();

  const highCount = report.insights.filter((i) => i.severity === "high").length;
  const avgScore = report.insights.length > 0
    ? Math.round(report.insights.reduce((s, i) => s + i.impactScore, 0) / report.insights.length)
    : 0;

  const handleToPrd = (insight: typeof report.insights[0]) => {
    const params = new URLSearchParams();
    params.set("from", "feedback");
    params.set("title", insight.title);
    params.set("description", `${insight.title}\n根因：${insight.rootCause}\n影响评分：${insight.impactScore}/10`);
    params.set("context", `来自用户反馈分析 - ${insight.count}位用户提及此问题`);
    router.push(`/requirements?tab=prd&${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{report.totalFeedbackCount}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">总反馈数</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{highCount}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">高优问题</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 text-center">
          <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">平均影响分</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{report.actionItems.length}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">行动建议</div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/50 dark:from-emerald-500/5 to-white dark:to-gray-900 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">分析摘要</h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.summary}</p>
        <div className="flex gap-2 mt-4">
          {report.categories.map((c) => <Badge key={c} variant="secondary" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">{catLabels[c]||c}</Badge>)}
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">关键洞察 ({report.insights.length})</h3>
        </div>
        <div className="space-y-4">
          {report.insights.sort((a,b)=>{ const o: Record<string,number>={high:3,medium:2,low:1}; return o[b.severity]-o[a.severity]; })
            .map((insight,i) => {
              const s = sevCfg[insight.severity];
              return (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{insight.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${s.clr}`}>{s.lbl}</span>
                    <Badge variant="outline" className="text-xs bg-white dark:bg-gray-800">{catLabels[insight.category]}</Badge>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{insight.count} 次提及</span>
                    <span className={`text-xs font-mono font-medium ${getScoreColor(insight.impactScore)}`}>影响 {insight.impactScore}/10</span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400" title={trendLabels[insight.sentimentTrend]}>
                      {trendIcons[insight.sentimentTrend]}
                    </span>
                  </div>

                  {insight.rootCause && (
                    <div className="flex items-start gap-2 mt-2 mb-2 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-amber-700 dark:text-amber-400">根因：</span>
                        {insight.rootCause}
                      </p>
                    </div>
                  )}

                  {insight.quotes.length>0 && (
                    <div className="space-y-1.5 mt-3">
                      {insight.quotes.map((q,j)=>(
                        <blockquote key={j} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3 text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed">&ldquo;{q}&rdquo;</blockquote>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleToPrd(insight)}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-medium transition-colors"
                  >
                    转为PRD需求 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action Items */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">行动建议 ({report.actionItems.length})</h3>
        </div>
        <div className="space-y-3">
          {report.actionItems.map((item,i)=>(
            <div key={i} className="flex gap-3 items-start">
              <span className={`text-xs px-2 py-0.5 rounded-full border mt-0.5 ${
                item.effort==="low"?"bg-green-50 text-green-700 border-green-200"
                :item.effort==="medium"?"bg-amber-50 text-amber-700 border-amber-200"
                :"bg-red-50 text-red-700 border-red-200"}`}>
                {item.effort==="low"?"低成本":item.effort==="medium"?"中成本":"高成本"}
              </span>
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.what}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
