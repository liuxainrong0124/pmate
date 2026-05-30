"use client";

import { useRouter } from "next/navigation";
import { CompetitorReport as CompetitorReportType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ListChecks, Shield, TrendingUp, Target, AlertTriangle, Users, Zap, Clock, DollarSign, Crosshair, ArrowRight } from "lucide-react";

interface CompetitorReportProps { report: CompetitorReportType; }

const assessmentCfg: Record<string, { label: string; clr: string }> = {
  advantage: { label: "优势", clr: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  disadvantage: { label: "劣势", clr: "bg-red-50 text-red-700 border-red-200" },
  parity: { label: "持平", clr: "bg-gray-50 text-gray-600 border-gray-200" },
};

const swotIcons: Record<string, React.ReactNode> = {
  strength: <Shield className="w-4 h-4 text-emerald-500" />,
  weakness: <AlertTriangle className="w-4 h-4 text-red-500" />,
  opportunity: <TrendingUp className="w-4 h-4 text-blue-500" />,
  threat: <AlertTriangle className="w-4 h-4 text-amber-500" />,
};
const swotLabels: Record<string, string> = { strength: "优势", weakness: "劣势", opportunity: "机会", threat: "威胁" };
const swotBorders: Record<string, string> = {
  strength: "border-l-emerald-400", weakness: "border-l-red-400",
  opportunity: "border-l-blue-400", threat: "border-l-amber-400",
};
const effortCfg: Record<string, string> = {
  low: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};
const effortLabels: Record<string, string> = { low: "低成本", medium: "中成本", high: "高成本" };

export function CompetitorReportDisplay({ report }: CompetitorReportProps) {
  const router = useRouter();

  const handleToPrd = (dimension: string, gap: string) => {
    const params = new URLSearchParams();
    params.set("from", "competitor");
    params.set("title", `追赶竞品 - ${dimension}`);
    params.set("description", `${dimension}方面存在差距：${gap}`);
    params.set("context", `来自竞品分析 - 需要在${dimension}维度追赶竞品`);
    router.push(`/requirements?tab=prd&${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900">竞争格局总览</h3>
        </div>
        <p className="text-gray-700 leading-relaxed">{report.summary}</p>
      </div>

      {/* Competitor Profiles */}
      {report.competitorProfiles.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900">竞品画像 ({report.competitorProfiles.length})</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {report.competitorProfiles.map((cp, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <h4 className="font-semibold text-gray-900 mb-2">{cp.name}</h4>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{cp.overview}</p>
                {cp.keyFeatures.length > 0 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cp.keyFeatures.map((f, j) => (
                        <Badge key={j} variant="secondary" className="text-xs bg-gray-50">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-400 space-y-1 mt-3">
                  <div><span className="font-medium">目标用户：</span>{cp.targetUsers}</div>
                  {cp.recentUpdates && <div><span className="font-medium">近期动态：</span>{cp.recentUpdates}</div>}
                </div>
                {(cp.strengthSummary || cp.weaknessSummary) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                    {cp.strengthSummary && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Shield className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-gray-600"><b className="text-emerald-600">可学：</b>{cp.strengthSummary}</span>
                      </div>
                    )}
                    {cp.weaknessSummary && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Crosshair className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-gray-600"><b className="text-red-600">可攻：</b>{cp.weaknessSummary}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Comparison */}
      {report.featureComparison.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-gray-900">维度对比</h3>
          </div>
          <div className="space-y-3">
            {report.featureComparison.map((fc, i) => {
              const a = assessmentCfg[fc.assessment];
              return (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 text-sm">{fc.dimension}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${a.clr}`}>{a.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400 text-xs">我方</span>
                      <p className="text-gray-700 mt-0.5">{fc.ourPosition}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-xs">竞品</span>
                      <p className="text-gray-700 mt-0.5">{fc.competitorPosition}</p>
                    </div>
                  </div>
                  {fc.gap && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">{fc.gap}</p>
                  )}
                  {fc.assessment === "disadvantage" && (
                    <button
                      onClick={() => handleToPrd(fc.dimension, fc.gap)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                    >
                      生成追赶PRD <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing & Differentiation */}
      <div className="grid gap-5 md:grid-cols-2">
        {report.pricingAnalysis && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <h4 className="font-semibold text-gray-900 text-sm">定价分析</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{report.pricingAnalysis}</p>
          </div>
        )}
        {report.differentiation && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-indigo-500" />
              <h4 className="font-semibold text-gray-900 text-sm">差异化建议</h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{report.differentiation}</p>
          </div>
        )}
      </div>

      {/* SWOT */}
      {report.strengthsWeaknesses.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">SWOT 分析</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {report.strengthsWeaknesses.map((sw, i) => (
              <div key={i} className={`border-l-2 ${swotBorders[sw.type]} pl-4 py-2`}>
                <div className="flex items-center gap-2 mb-1">
                  {swotIcons[sw.type]}
                  <span className="text-xs text-gray-400">{swotLabels[sw.type]}</span>
                  <span className="text-xs text-gray-300">| {sw.relatedCompetitor}</span>
                </div>
                <p className="font-medium text-sm text-gray-900">{sw.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sw.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Predicted Moves */}
      {report.predictedMoves && (
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/30 to-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            <h4 className="font-semibold text-gray-900 text-sm">竞品动向预测</h4>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{report.predictedMoves}</p>
        </div>
      )}

      {/* Opportunities & Threats */}
      <div className="grid gap-5 md:grid-cols-2">
        {report.opportunities.length > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h4 className="font-semibold text-gray-900 text-sm">市场机会</h4>
            </div>
            <ul className="space-y-2">
              {report.opportunities.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-emerald-400 mt-1 shrink-0">+</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
        {report.threats.length > 0 && (
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/30 to-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="font-semibold text-gray-900 text-sm">潜在威胁</h4>
            </div>
            <ul className="space-y-2">
              {report.threats.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-400 mt-1 shrink-0">-</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Timeline */}
      {report.timeline.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">行动时间线</h3>
          </div>
          <div className="space-y-4">
            {report.timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-24 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    t.phase.includes("短期") ? "bg-red-50 text-red-700 border-red-200" :
                    t.phase.includes("中期") ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>{t.phase}</span>
                </div>
                <div className="flex-1">
                  <ul className="space-y-1">
                    {t.actions.map((a, j) => (
                      <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-gray-300 mt-1">-</span>{a}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-400 mt-1.5">目标：{t.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {report.actionItems.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900">行动建议 ({report.actionItems.length})</h3>
          </div>
          <div className="space-y-3">
            {report.actionItems.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`text-xs px-2 py-0.5 rounded-full border mt-0.5 ${effortCfg[item.effort]}`}>
                  {effortLabels[item.effort]}
                </span>
                <div>
                  <p className="font-medium text-sm text-gray-900">{item.what}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
