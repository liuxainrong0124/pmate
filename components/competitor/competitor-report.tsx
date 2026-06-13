"use client";

import { useRouter } from "next/navigation";
import { CompetitorReport as CompetitorReportType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/competitor/radar-chart";
import { Lightbulb, ListChecks, Shield, TrendingUp, Target, AlertTriangle, Users, Zap, Clock, DollarSign, Crosshair, ArrowRight, Building2, Calendar, Gauge, BarChart3 } from "lucide-react";
import { addPoolRequirement, addLog } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

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
    addLog("cross_module", "PRD", `从竞品分析转向PRD: ${dimension}`);
    const params = new URLSearchParams();
    params.set("from", "competitor");
    params.set("title", `追赶竞品 - ${dimension}`);
    params.set("description", `${dimension}方面存在差距：${gap}`);
    params.set("context", `来自竞品分析 - 需要在${dimension}维度追赶竞品`);
    router.push(`/requirements?tab=prd&${params.toString()}`);
  };

  const handleToPool = (dimension: string) => {
    addPoolRequirement({
      title: `追赶竞品 - ${dimension}`,
      module: "竞品追踪",
      status: "planning",
      priority: "p1",
      impact: 7,
      effort: 5,
      assignee: "",
      backupAssignee: "",
      approvalStatus: "pending",
    });
    addLog("cross_module", "需求池", `从竞品分析创建需求: ${dimension}`);
    showToast("已加入需求池", "success");
    router.push("/requirements?tab=pool");
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

      {/* Company Overview (AI 全自动分析) */}
      {report.company && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">竞品画像</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-400">公司名称</span>
                <p className="font-semibold text-gray-900">{report.company.name}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-xs text-gray-400">成立时间</span>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {report.company.founded}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400">产品定位</span>
                <p className="text-sm text-gray-700">{report.company.positioning}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">目标用户</span>
                <p className="text-sm text-gray-700">{report.company.targetUsers}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">商业模式</span>
                <p className="text-sm text-gray-700">{report.company.businessModel}</p>
              </div>
            </div>
            <div className="space-y-3">
              {(report.company.coreFeatures?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-gray-400">核心功能</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {report.company.coreFeatures.map((f, j) => (
                      <Badge key={j} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(report.company.recentUpdates?.length ?? 0) > 0 && (
                <div>
                  <span className="text-xs text-gray-400">近期更新</span>
                  <ul className="mt-1 space-y-2">
                    {report.company.recentUpdates.map((u, j) => (
                      <li key={j} className="text-xs text-gray-600 border-l-2 border-indigo-200 pl-2">
                        <div className="font-medium">{typeof u === "string" ? u : u.update}</div>
                        {typeof u !== "string" && (u.date || u.significance || u.strategicIntent) && (
                          <div className="flex gap-2 mt-0.5 text-gray-400">
                            {u.date && <span>{u.date}</span>}
                            {u.significance && <span>· {u.significance}</span>}
                            {u.strategicIntent && <span className="text-indigo-400">· 意图：{u.strategicIntent}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SWOT Four-Quadrant (AI 全自动分析) */}
      {report.swot && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-gray-900">SWOT 分析</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> 优势 Strengths
              </h4>
              <ul className="space-y-2">
                {(report.swot.strengths ?? []).map((s, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-emerald-800 font-medium">+ {typeof s === "string" ? s : s.item}</span>
                    {typeof s !== "string" && (s.evidence || s.defensibility) && (
                      <div className="mt-0.5 ml-4 text-gray-500 space-y-0.5">
                        {s.evidence && <div>📌 {s.evidence}</div>}
                        {s.defensibility && <div>🛡 可防御性：{s.defensibility}</div>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Weaknesses */}
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> 劣势 Weaknesses
              </h4>
              <ul className="space-y-2">
                {(report.swot.weaknesses ?? []).map((s, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-red-800 font-medium">- {typeof s === "string" ? s : s.item}</span>
                    {typeof s !== "string" && (s.evidence || s.exploitability) && (
                      <div className="mt-0.5 ml-4 text-gray-500 space-y-0.5">
                        {s.evidence && <div>📌 {s.evidence}</div>}
                        {s.exploitability && <div>🎯 {s.exploitability}</div>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Opportunities */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> 机会 Opportunities
              </h4>
              <ul className="space-y-2">
                {(report.swot.opportunities ?? []).map((s, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-blue-800 font-medium">+ {typeof s === "string" ? s : s.item}</span>
                    {typeof s !== "string" && (s.timeWindow || s.effortRequired) && (
                      <div className="mt-0.5 ml-4 text-gray-500 flex gap-2">
                        {s.timeWindow && <span>⏱ {s.timeWindow}</span>}
                        {s.effortRequired && <span>· 💪 {s.effortRequired}</span>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {/* Threats */}
            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
              <h4 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> 威胁 Threats
              </h4>
              <ul className="space-y-2">
                {(report.swot.threats ?? []).map((s, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-orange-800 font-medium">- {typeof s === "string" ? s : s.item}</span>
                    {typeof s !== "string" && (s.urgency || s.ourDefense) && (
                      <div className="mt-0.5 ml-4 text-gray-500 space-y-0.5">
                        {s.urgency && <div>⚠ 紧迫度：{s.urgency}</div>}
                        {s.ourDefense && <div>🛡 {s.ourDefense}</div>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Radar Chart (AI 全自动分析) */}
      {report.comparison && (report.comparison.dimensions?.length ?? 0) >= 3 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900">功能对比雷达图</h3>
          </div>
          <RadarChart
            dimensions={report.comparison.dimensions}
            yourScore={report.comparison.yourScore}
            competitorScore={report.comparison.competitorScore}
          />
          <div className="grid grid-cols-2 gap-3 mt-4">
            {report.comparison.dimensions.map((dim, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-600">{dim}</span>
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 font-medium">{report.comparison!.yourScore[i]}</span>
                  <span className="text-gray-300">vs</span>
                  <span className="text-red-500 font-medium">{report.comparison!.competitorScore[i]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact Assessment (AI 全自动分析) */}
      {report.impact && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-gray-900">影响评估</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">用户流失风险</span>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                report.impact.userChurnRisk === "高"
                  ? "bg-red-100 text-red-700"
                  : report.impact.userChurnRisk === "中"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                {report.impact.userChurnRisk}
              </span>
            </div>
            {report.impact.gapAnalysis && (
              <div className="bg-gray-50 rounded-xl p-4">
                <span className="text-xs text-gray-400 block mb-1">差距分析</span>
                <p className="text-sm text-gray-700 leading-relaxed">{report.impact.gapAnalysis}</p>
              </div>
            )}
            {(report.impact.suggestions?.length ?? 0) > 0 && (
              <div>
                <span className="text-xs text-gray-400 block mb-2">建议动作</span>
                <div className="space-y-2">
                  {report.impact.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-rose-50/50 rounded-lg px-3 py-2 border border-rose-100">
                      <span className="text-rose-500 font-medium shrink-0">{i + 1}.</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competitor Profiles */}
      {(report.competitorProfiles?.length ?? 0) > 0 && (
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
      {(report.featureComparison?.length ?? 0) > 0 && (
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
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => handleToPrd(fc.dimension, fc.gap)}
                        className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
                      >
                        生成追赶PRD <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleToPool(fc.dimension)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                      >
                        加入需求池 <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
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
            {typeof report.pricingAnalysis === "string" ? (
              <p className="text-sm text-gray-700 leading-relaxed">{report.pricingAnalysis}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400 text-xs">竞品定价</span><p className="text-gray-700">{report.pricingAnalysis.competitorPricing}</p></div>
                <div><span className="text-gray-400 text-xs">我方定价</span><p className="text-gray-700">{report.pricingAnalysis.ourPricing}</p></div>
                <div><span className="text-gray-400 text-xs">定价差距</span><p className="text-gray-700">{report.pricingAnalysis.pricingGap}</p></div>
                <div className="pt-2 border-t border-gray-100"><span className="text-gray-400 text-xs">建议</span><p className="text-gray-900 font-medium">{report.pricingAnalysis.recommendation}</p></div>
              </div>
            )}
          </div>
        )}
        {report.differentiation && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Crosshair className="w-4 h-4 text-indigo-500" />
              <h4 className="font-semibold text-gray-900 text-sm">差异化建议</h4>
            </div>
            {typeof report.differentiation === "string" ? (
              <p className="text-sm text-gray-700 leading-relaxed">{report.differentiation}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400 text-xs">当前差异化</span><p className="text-gray-700">{report.differentiation.current}</p></div>
                <div><span className="text-gray-400 text-xs">未被满足的空间</span><p className="text-gray-700">{report.differentiation.opportunity}</p></div>
                <div className="pt-2 border-t border-gray-100"><span className="text-gray-400 text-xs">建议定位</span><p className="text-gray-900 font-medium">{report.differentiation.recommendedPositioning}</p></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SWOT */}
      {(report.strengthsWeaknesses?.length ?? 0) > 0 && (
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
      {(Array.isArray(report.predictedMoves) ? report.predictedMoves.length > 0 : report.predictedMoves) && (
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/30 to-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-purple-500" />
            <h4 className="font-semibold text-gray-900 text-sm">竞品动向预测</h4>
          </div>
          {typeof report.predictedMoves === "string" ? (
            <p className="text-sm text-gray-700 leading-relaxed">{report.predictedMoves}</p>
          ) : (
            <div className="space-y-3">
              {report.predictedMoves.map((m, i) => (
                <div key={i} className="border-l-2 border-purple-300 pl-3 text-sm">
                  <p className="font-medium text-gray-900">{m.move}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {m.probability && <span>概率：{m.probability}</span>}
                    {m.timing && <span>· {m.timing}</span>}
                    {m.ourResponse && <span className="text-purple-600">· 应对：{m.ourResponse}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Opportunities & Threats */}
      <div className="grid gap-5 md:grid-cols-2">
        {(report.opportunities?.length ?? 0) > 0 && (
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
        {(report.threats?.length ?? 0) > 0 && (
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
      {(report.timeline?.length ?? 0) > 0 && (
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
      {(report.actionItems?.length ?? 0) > 0 && (
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
