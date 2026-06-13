"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Plus, X, Sparkles, Loader2, Trash2, TrendingDown, Target, Play, Square, CheckCircle, BarChart3 } from "lucide-react";
import { getUserApiKey } from "@/lib/store/local-store";
import {
  getExperiments, addExperiment, updateExperiment, deleteExperiment,
  StoredExperiment,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { twoProportionZTest } from "@/lib/stats";

interface AnalysisResult {
  statisticalSummary: {
    controlRate: string;
    experimentRate: string;
    absoluteLift: string;
    relativeLift: string;
    zScore: number;
    pValue: string;
    confidenceInterval: string;
    significant: boolean;
    power: string;
    sampleSizeAdequate: string;
  };
  businessImpact: {
    practicalSignificance: string;
    northStarAlignment: string;
    expectedROI: string;
    userExperienceImpact: string;
  };
  noveltyCheck: {
    durationRisk: string;
    recommendation: string;
    trendStabilityNote: string;
  };
  segmentationRisks: {
    simpsonWarning: string;
    recommendedSegments: string[];
    potentialReversals: string;
  };
  longTermProjection: {
    oneMonthEffect: string;
    threeMonthEffect: string;
    keyAssumptions: string[];
    decayRisk: string;
  };
  recommendation: {
    verdict: string;
    rationale: string;
    ifLaunch: string;
    ifExtend: string;
    ifRedesign: string;
    risks: string[];
    nextSteps: string[];
  };
}

const statusMeta: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  running: { label: "进行中", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ended: { label: "已结束", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

function getDemoAnalysis(): AnalysisResult {
  return {
    statisticalSummary: {
      controlRate: "12.0%",
      experimentRate: "14.8%",
      absoluteLift: "+2.8 个百分点",
      relativeLift: "+23.3%",
      zScore: 3.12,
      pValue: "p = 0.0018 (< 0.01，高度显著)",
      confidenceInterval: "[+1.0%, +4.6%] (95% 置信区间不含0，结果可信)",
      significant: true,
      power: "统计功效 94%（充足）",
      sampleSizeAdequate: "样本量充足（每组5000，远超最低要求每組1800）",
    },
    businessImpact: {
      practicalSignificance: "点击率提升2.8个百分点意味着每日额外约1,400次点击（基于50,000日活）。假设点击到下单转化率10%，日均额外订单140单，按客单价200元计算，月均额外GMV约84万元。",
      northStarAlignment: "点击率是转化的上游漏斗指标，提升点击率→提升详情页到达→提升下单转化→提升GMV。但需关注：点击率提升是否带来等比例的转化提升，还是只增加了无效浏览。",
      expectedROI: "按钮改色为纯前端改动，开发成本约2人天。按保守估计仅10%的点击增量转化为实际订单，ROI仍为正（840元/天增量GMV vs 几乎为0的维护成本）。结论：高ROI改动，建议尽快上线。",
      userExperienceImpact: "正面：红色按钮引导性更强，减少用户犹豫时间。潜在负面：如果全站按钮都改成红色可能引起视觉疲劳，建议仅在关键CTA使用。",
    },
    noveltyCheck: {
      durationRisk: "低",
      recommendation: "7天实验期已足够排除新奇效应。实验组第7天表现（14.6%）与第3天（14.9%）无显著差异，趋势稳定。",
      trendStabilityNote: "逐日数据波动小（标准差<0.5pp），说明效果不是昙花一现。建议全量推全后继续监控30天确认无衰减。",
    },
    segmentationRisks: {
      simpsonWarning: "建议分层分析：新用户vs老用户、iOS vs Android、不同流量来源。本实验仅展示总体数据，细分维度可能存在反转（如新用户偏爱蓝色而老用户偏爱红色）。",
      recommendedSegments: ["新用户 vs 老用户", "iOS vs Android", "自然流量 vs 付费流量", "一线城市 vs 二三线城市"],
      potentialReversals: "新用户（注册<7天）可能对蓝色按钮信任度更高，建议单独分析该人群数据后再决定是否全量。",
    },
    longTermProjection: {
      oneMonthEffect: "推全1个月后预期点击率在14.5%-15.0%区间，效果趋于稳定。用户对新颜色的适应期约1-2周，之后点击率进入稳态。",
      threeMonthEffect: "3个月后效果可能衰减至+20%左右（用户对红色的新鲜感下降），但仍高于基准线。建议3个月后重新A/B测试不同颜色方案以寻找新的最优解。",
      keyAssumptions: ["竞品不在此期间进行重大UI改版", "产品核心功能不发生根本变化", "用户群体特征保持稳定"],
      decayRisk: "中（新鲜感衰减是颜色类改动的常见模式，但不至于降至基准线以下）",
    },
    recommendation: {
      verdict: "建议全量推全",
      rationale: "1) 统计高度显著(p<0.01)；2) 提升幅度23.3%有业务意义；3) 样本量充足；4) 无新奇效应；5) 实施方案成本极低。综合评估：这是一个'安全且有效'的改动，没有明显理由继续观望。",
      ifLaunch: "灰度策略：第一天20%→第三天50%→第五天100%。监控指标：点击率、详情页到达率、下单转化率（确保整个漏斗都正向）。回滚条件：任何一步出现点击率下降>5%立即回滚。",
      ifExtend: "如果决定延长，建议再跑7天以获取14天数据，同时增加分层分析维度。但基于当前数据，延长实验的边际收益较低。",
      ifRedesign: "如果要重新设计，建议测试更多颜色变体（橙色、绿色）以及按钮大小、位置、文案的组合效果，而不仅限于红蓝对比。",
      risks: ["用户对新颜色的适应期可能需要1-2周", "不同页面背景下的红色按钮效果待验证", "按钮颜色可能与部分品牌合作页面的UI冲突"],
      nextSteps: ["灰度50%流量观察3天确认效果稳定", "同步测试不同页面位置的按钮颜色效果", "监控按钮点击后的转化率是否有连带变化", "3个月后重新A/B测试更多颜色方案"],
    },
  };
}

export function ExperimentManager() {
  const [experiments, setExperiments] = useState<StoredExperiment[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", goalMetric: "点击率", description: "",
    groupA: "", groupB: "", trafficSplit: 50, plannedDays: 7,
  });

  // AI Analysis
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isDemoAnalysis, setIsDemoAnalysis] = useState(false);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<StoredExperiment | null>(null);
  const [drawerForm, setDrawerForm] = useState<StoredExperiment | null>(null);

  const refresh = () => setExperiments(getExperiments());

  useEffect(() => { refresh(); setLoaded(true); }, []);

  const handleCreate = () => {
    if (!createForm.name.trim() || !createForm.groupA.trim() || !createForm.groupB.trim()) return;
    addExperiment({ ...createForm, trafficSplit: createForm.trafficSplit, plannedDays: createForm.plannedDays, description: createForm.description, startDate: "" });
    showToast("实验已创建", "success");
    setCreateOpen(false);
    setCreateForm({ name: "", goalMetric: "点击率", description: "", groupA: "", groupB: "", trafficSplit: 50, plannedDays: 7 });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteExperiment(id);
    showToast("已删除", "success");
    setDrawerOpen(false);
    refresh();
  };

  const handleStart = (id: string) => {
    updateExperiment(id, { status: "running", startDate: new Date().toISOString().slice(0, 10) });
    showToast("实验已启动", "success");
    refresh();
  };

  const handleEnd = (id: string) => {
    updateExperiment(id, { status: "ended", endDate: new Date().toISOString().slice(0, 10) });
    showToast("实验已结束", "success");
    refresh();
  };

  const handleSaveDrawer = () => {
    if (!drawerForm || !selectedExp) return;
    updateExperiment(selectedExp.id, drawerForm);
    showToast("保存成功", "success");
    setDrawerOpen(false);
    refresh();
  };

  const handleAnalyze = async (exp: StoredExperiment) => {
    setAnalyzingId(exp.id);
    setAnalysisError(null);
    setIsDemoAnalysis(false);

    // Step 1: Compute real statistics locally (no AI hallucination)
    const stats = twoProportionZTest(
      Math.round(exp.valueA * exp.sampleA),
      exp.sampleA,
      Math.round(exp.valueB * exp.sampleB),
      exp.sampleB
    );

    try {
      const res = await fetch("/api/experiment/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: getUserApiKey(),
          experiment: {
            name: exp.name,
            goalMetric: exp.goalMetric,
            groupA: { name: exp.groupA, sample: exp.sampleA, value: exp.valueA },
            groupB: { name: exp.groupB, sample: exp.sampleB, value: exp.valueB },
            plannedDays: exp.plannedDays,
          },
          statsResult: {
            controlRate: stats.controlRate,
            experimentRate: stats.experimentRate,
            absoluteLift: stats.absoluteLift,
            relativeLift: stats.relativeLift,
            zScore: stats.zScore,
            pValue: stats.pValue,
            significant: stats.significant,
            confidenceLevel: stats.confidenceLevel,
            ciLow: stats.ciLow,
            ciHigh: stats.ciHigh,
            sampleSizeAdequate: stats.sampleSizeAdequate,
            minSampleNeeded: stats.minSampleNeeded,
            power: stats.power,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) { setAnalysisResult(data.analysis); setAnalyzingId(null); return; }
      }
      throw new Error("AI 分析失败");
    } catch {
      setAnalysisError("分析失败，请检查 API Key 配置");
    }
    setAnalyzingId(null);
  };

  const handleUseDemo = () => {
    setAnalysisResult(getDemoAnalysis());
    setIsDemoAnalysis(true);
    setAnalysisError(null);
  };

  const inputCls = "w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors";

  if (!loaded) return null;

  const running = experiments.filter(e => e.status === "running");
  const draft = experiments.filter(e => e.status === "draft");

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <FlaskConical className="w-4 h-4" />
          <span>共 {experiments.length} 个实验</span>
          {running.length > 0 && <span className="text-blue-600">· {running.length} 个进行中</span>}
          {draft.length > 0 && <span className="text-gray-400">· {draft.length} 个草稿</span>}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />新建实验
        </button>
      </div>

      {/* Experiment list */}
      {experiments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center">
          <FlaskConical className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">暂无A/B实验</p>
          <p className="text-gray-400 text-xs">新建实验，对比不同方案效果，AI 帮你分析结果</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              onClick={() => { setSelectedExp(exp); setDrawerForm({ ...exp }); setDrawerOpen(true); }}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{exp.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Target className="w-3 h-3" />
                      <span>目标指标: {exp.goalMetric}</span>
                      {exp.status !== "draft" && <span>· {exp.plannedDays}天</span>}
                    </div>
                  </div>
                  <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusMeta[exp.status]?.color}`}>
                    {statusMeta[exp.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 p-2.5">
                    <p className="text-[10px] text-blue-500 font-medium uppercase">对照组</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{exp.groupA}</p>
                    {exp.status !== "draft" && (
                      <p className="text-[10px] text-gray-400 mt-1">样本 {exp.sampleA.toLocaleString()} · {exp.goalMetric} {exp.valueA}</p>
                    )}
                  </div>
                  <div className="rounded-lg bg-violet-50 dark:bg-violet-500/10 p-2.5">
                    <p className="text-[10px] text-violet-500 font-medium uppercase">实验组</p>
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{exp.groupB}</p>
                    {exp.status !== "draft" && (
                      <p className="text-[10px] text-gray-400 mt-1">样本 {exp.sampleB.toLocaleString()} · {exp.goalMetric} {exp.valueB}</p>
                    )}
                  </div>
                </div>

                {exp.status === "ended" && exp.conclusion && (
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2.5">
                    <p className="text-[10px] text-gray-400 font-medium uppercase mb-0.5">结论</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{exp.conclusion}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  {exp.status === "draft" && (
                    <button onClick={(e) => { e.stopPropagation(); handleStart(exp.id); }} className="text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 font-medium transition-colors flex items-center gap-1">
                      <Play className="w-3 h-3" />启动实验
                    </button>
                  )}
                  {exp.status === "running" && (
                    <button onClick={(e) => { e.stopPropagation(); handleEnd(exp.id); }} className="text-xs rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 font-medium transition-colors flex items-center gap-1">
                      <Square className="w-3 h-3" />结束实验
                    </button>
                  )}
                  {exp.status !== "draft" && exp.sampleA > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(exp); }}
                      disabled={analyzingId === exp.id}
                      className="text-xs rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {analyzingId === exp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI 分析
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Analysis Modal */}
      {(analyzingId || analysisResult) && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60" onClick={() => { setAnalysisResult(null); setAnalysisError(null); }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI 实验结果分析</h3>
              </div>
              <button onClick={() => { setAnalysisResult(null); setAnalysisError(null); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {analyzingId && (
              <div className="flex items-center gap-3 py-8 justify-center">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                <span className="text-sm text-gray-500">AI 正在分析实验数据...</span>
              </div>
            )}

            {analysisError && !analysisResult && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-red-700 font-medium mb-1">分析失败</p>
                <p className="text-xs text-red-600 mb-3">{analysisError}</p>
                <button onClick={handleUseDemo} className="rounded-lg border border-red-200 text-red-600 hover:bg-red-100 text-xs px-3 py-1.5">使用演示数据</button>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4 animate-fade-in text-sm">
                {isDemoAnalysis && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>}

                {/* 1. Statistical Summary */}
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">统计指标（前端实时计算，非AI生成）</h5>
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`text-3xl font-bold ${analysisResult.statisticalSummary.significant ? "text-emerald-600" : "text-amber-600"}`}>
                      {analysisResult.statisticalSummary.relativeLift}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-xs text-gray-500">
                        对照 {analysisResult.statisticalSummary.controlRate} → 实验 {analysisResult.statisticalSummary.experimentRate}
                      </p>
                      <p className="text-xs text-gray-500">{analysisResult.statisticalSummary.pValue}</p>
                      <p className="text-xs text-gray-500">Z = {analysisResult.statisticalSummary.zScore.toFixed(2)} · {analysisResult.statisticalSummary.power}</p>
                    </div>
                    {analysisResult.statisticalSummary.significant ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500 ml-auto" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-amber-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">置信区间: {analysisResult.statisticalSummary.confidenceInterval}</p>
                  <p className="text-xs text-gray-400">{analysisResult.statisticalSummary.sampleSizeAdequate}</p>
                </div>

                {/* 2. Recommendation */}
                <div className={`rounded-lg p-3 ${analysisResult.recommendation.verdict.includes("全量") ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20" : "bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20"}`}>
                  <p className="text-sm font-semibold">{analysisResult.recommendation.verdict}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{analysisResult.recommendation.rationale}</p>
                </div>

                {/* 3. Business Impact */}
                <details className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <summary className="text-xs font-semibold text-gray-500 cursor-pointer">业务影响分析</summary>
                  <div className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">实际意义：</span>{analysisResult.businessImpact.practicalSignificance}</p>
                    <p><span className="font-medium">北极星对齐：</span>{analysisResult.businessImpact.northStarAlignment}</p>
                    <p><span className="font-medium">预估ROI：</span>{analysisResult.businessImpact.expectedROI}</p>
                    <p><span className="font-medium">用户体验：</span>{analysisResult.businessImpact.userExperienceImpact}</p>
                  </div>
                </details>

                {/* 4. Novelty Check */}
                <details className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <summary className="text-xs font-semibold text-gray-500 cursor-pointer">新奇效应评估</summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>风险等级：{analysisResult.noveltyCheck.durationRisk} · {analysisResult.noveltyCheck.recommendation}</p>
                    <p>{analysisResult.noveltyCheck.trendStabilityNote}</p>
                  </div>
                </details>

                {/* 5. Segmentation Risks */}
                <details className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <summary className="text-xs font-semibold text-gray-500 cursor-pointer">分层分析建议</summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>{analysisResult.segmentationRisks.simpsonWarning}</p>
                    <p className="text-amber-600">{analysisResult.segmentationRisks.potentialReversals}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {analysisResult.segmentationRisks.recommendedSegments.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">{s}</span>
                      ))}
                    </div>
                  </div>
                </details>

                {/* 6. Long-term Projection */}
                <details className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <summary className="text-xs font-semibold text-gray-500 cursor-pointer">长期效果推演</summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p><span className="font-medium">1个月：</span>{analysisResult.longTermProjection.oneMonthEffect}</p>
                    <p><span className="font-medium">3个月：</span>{analysisResult.longTermProjection.threeMonthEffect}</p>
                    <p><span className="font-medium">衰减风险：</span>{analysisResult.longTermProjection.decayRisk}</p>
                    <p className="text-gray-400 mt-1">假设：{analysisResult.longTermProjection.keyAssumptions.join("；")}</p>
                  </div>
                </details>

                {/* 7. Risks & Next Steps */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">风险与下一步</h5>
                  {analysisResult.recommendation.risks.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400"><span className="mt-0.5">·</span> {r}</div>
                  ))}
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">执行计划</h5>
                  {analysisResult.recommendation.nextSteps.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <span className="text-violet-500 font-medium mt-0.5">{i + 1}.</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60" onClick={() => setCreateOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">新建 A/B 实验</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验名称 *</label>
                <input placeholder="如：首页按钮颜色测试" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">目标指标</label>
                  <select value={createForm.goalMetric} onChange={(e) => setCreateForm({ ...createForm, goalMetric: e.target.value })} className={inputCls}>
                    <option value="点击率">点击率</option>
                    <option value="转化率">转化率</option>
                    <option value="留存率">留存率</option>
                    <option value="打开率">打开率</option>
                    <option value="付费率">付费率</option>
                    <option value="完播率">完播率</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验描述</label>
                  <input placeholder="实验目的和假设" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">对照组描述 *</label>
                  <input placeholder="如：蓝色按钮（原版）" value={createForm.groupA} onChange={(e) => setCreateForm({ ...createForm, groupA: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验组描述 *</label>
                  <input placeholder="如：红色按钮（新版）" value={createForm.groupB} onChange={(e) => setCreateForm({ ...createForm, groupB: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">流量分配 (%)</label>
                  <input type="number" min="1" max="99" value={createForm.trafficSplit} onChange={(e) => setCreateForm({ ...createForm, trafficSplit: parseInt(e.target.value) || 50 })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">计划天数</label>
                  <input type="number" min="1" max="90" value={createForm.plannedDays} onChange={(e) => setCreateForm({ ...createForm, plannedDays: parseInt(e.target.value) || 7 })} className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} disabled={!createForm.name.trim() || !createForm.groupA.trim() || !createForm.groupB.trim()} className="rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50">创建</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedExp && drawerForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full z-50 w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl transition-transform flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">实验详情</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验名称</label>
                <input value={drawerForm.name} onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">目标指标</label>
                  <input value={drawerForm.goalMetric} onChange={(e) => setDrawerForm({ ...drawerForm, goalMetric: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">状态</label>
                  <select value={drawerForm.status} onChange={(e) => setDrawerForm({ ...drawerForm, status: e.target.value as StoredExperiment["status"] })} className={inputCls}>
                    {Object.entries(statusMeta).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验描述</label>
                <textarea value={drawerForm.description} onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">对照组</label>
                  <input value={drawerForm.groupA} onChange={(e) => setDrawerForm({ ...drawerForm, groupA: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验组</label>
                  <input value={drawerForm.groupB} onChange={(e) => setDrawerForm({ ...drawerForm, groupB: e.target.value })} className={inputCls} />
                </div>
              </div>
              {drawerForm.status !== "draft" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">对照组样本</label>
                    <input type="number" value={drawerForm.sampleA} onChange={(e) => setDrawerForm({ ...drawerForm, sampleA: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">实验组样本</label>
                    <input type="number" value={drawerForm.sampleB} onChange={(e) => setDrawerForm({ ...drawerForm, sampleB: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">流量分配%</label>
                    <input type="number" min="1" max="99" value={drawerForm.trafficSplit} onChange={(e) => setDrawerForm({ ...drawerForm, trafficSplit: parseInt(e.target.value) || 50 })} className={inputCls} />
                  </div>
                </div>
              )}
              {drawerForm.status !== "draft" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{drawerForm.goalMetric} (对照)</label>
                    <input type="number" step="0.001" value={drawerForm.valueA} onChange={(e) => setDrawerForm({ ...drawerForm, valueA: parseFloat(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{drawerForm.goalMetric} (实验)</label>
                    <input type="number" step="0.001" value={drawerForm.valueB} onChange={(e) => setDrawerForm({ ...drawerForm, valueB: parseFloat(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">提升幅度</label>
                    <input type="number" step="0.001" value={drawerForm.lift} onChange={(e) => setDrawerForm({ ...drawerForm, lift: parseFloat(e.target.value) || 0 })} className={inputCls} />
                  </div>
                </div>
              )}
              {drawerForm.status !== "draft" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">置信度</label>
                    <input type="number" step="0.01" min="0" max="1" value={drawerForm.confidence} onChange={(e) => setDrawerForm({ ...drawerForm, confidence: parseFloat(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">计划天数</label>
                    <input type="number" value={drawerForm.plannedDays} onChange={(e) => setDrawerForm({ ...drawerForm, plannedDays: parseInt(e.target.value) || 7 })} className={inputCls} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">结论</label>
                <textarea value={drawerForm.conclusion} onChange={(e) => setDrawerForm({ ...drawerForm, conclusion: e.target.value })} rows={3} placeholder="实验结论..." className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveDrawer} className="flex-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">保存</button>
                <button onClick={() => handleDelete(selectedExp.id)} className="rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
