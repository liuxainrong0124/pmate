"use client";

import { useState } from "react";
import { FileText, Sparkles, Loader2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserApiKey } from "@/lib/store/local-store";
import {
  getPoolRequirements, getActivities, getExperiments,
  getCompetitorHistory, getFeedbackHistory, getUploadedMetrics,
} from "@/lib/store/local-store";

interface ReportRisk {
  risk: string;
  severity?: string;
  probability?: string;
  impact?: string;
  mitigation?: string;
  owner?: string;
}

interface ReportSection {
  heading: string;
  icon: string;
  situation?: string;
  analysis?: string;
  implications?: string;
  content?: string;
  highlights: string[];
  risks: ReportRisk[];
  metricChanges: { label: string; current: string; change?: string; trend?: string }[];
  recommendations?: string[];
}

interface PlanItem {
  item: string;
  priority?: string;
  rationale?: string;
  expectedOutcome?: string;
  owner?: string;
  blockers?: string[];
}

interface ReportData {
  title: string;
  period: string;
  executiveSummary: string | { headline?: string; overallAssessment?: string; topFindings?: string[] };
  sections: ReportSection[];
  nextWeekPlan: PlanItem[];
  overallMood: string;
  keyTakeaways: string[];
}

const iconMap: Record<string, string> = {
  TrendingUp: "📈", Users: "👥", Megaphone: "📢", FlaskConical: "🧪", Target: "🎯", MessageSquare: "💬",
  BarChart3: "📊", FileText: "📄", Clock: "⏰", AlertTriangle: "⚠️",
};

function getDemoReport(period: string): ReportData {
  return {
    title: `${period}产品与运营周报`,
    period,
    executiveSummary: `本周DAU稳定在1.2万，环比增长3.2%；推送打开率28.2%创近4周新高；需求池9条需求中3条已上线，2条在测试；A/B实验确认红色按钮方案胜出，建议下周全量推全。主要风险：次日留存下降0.8pp至38%，已定位为首屏加载慢导致，性能优化专项下周启动。`,
    sections: [
      {
        heading: "核心指标", icon: "TrendingUp",
        content: "本周DAU日均12,400（环比+3.2%），峰值出现在周四（13,200）。次日留存38%（环比-0.8pp），首屏加载时间中位数1.8s（环比+0.3s）是主因。推送打开率28.2%（环比+3.7pp），受益于分时段精准推送策略。LTV ¥28.5（环比+2%），付费用户占比提升至9.5%。",
        highlights: ["DAU连续3周上涨，增长可持续", "推送打开率创近4周新高", "付费用户占比突破9%"],
        risks: [
          { risk: "次日留存下降0.8pp", severity: "高", mitigation: "性能优化专项" },
          { risk: "首屏加载时间增加0.3s", severity: "中", mitigation: "排查首屏资源加载" },
        ],
        metricChanges: [
          { label: "DAU", current: "12,400", change: "+3.2%", trend: "up" },
          { label: "次日留存", current: "38%", change: "-0.8pp", trend: "down" },
          { label: "推送打开率", current: "28.2%", change: "+3.7pp", trend: "up" },
          { label: "LTV", current: "¥28.5", change: "+2%", trend: "up" },
        ],
      },
      {
        heading: "需求进度", icon: "FileText",
        content: "本周需求池共9条需求：3条已上线（数据看板导出、异常场景知识库、运营活动模板库），2条测试中（用户画像标签体系、反馈情感趋势分析），2条开发中（用户个人主页改版、推送消息A/B测试），2条待评审（iOS端适配、竞品动态自动抓取）。REQ-004（用户画像标签体系）因人力不足延期2天，已协调小红全力投入。",
        highlights: ["3条需求按时上线", "REQ-001用户个人主页改版进度80%"],
        risks: [{ risk: "REQ-004画像标签体系延期2天", severity: "中", mitigation: "协调小红全力投入" }, { risk: "iOS适配缺乏iOS开发资源", severity: "低" }],
        metricChanges: [],
      },
      {
        heading: "运营活动", icon: "Megaphone",
        content: "新用户引导活动累计参与1250人，转化率18%，符合预期。618大促方案已通过评审，预算8.8万，预计6月10日启动预热。五一打卡活动收尾总结：8900人参与，转化率22%，ROI 1:3.1，超出预期。",
        highlights: ["五一活动ROI 1:3.1超预期", "618大促方案已就绪"],
        risks: [{ risk: "618活动服务器压测安排在6月12日，时间偏紧", severity: "高", mitigation: "提前至6月8日启动压测" }],
        metricChanges: [],
      },
      {
        heading: "A/B实验", icon: "FlaskConical",
        content: "首页按钮颜色测试已结束（运行7天，样本5000vs5000），红色按钮点击率14.8% vs 蓝色12.0%，提升23.3%，p=0.0032统计显著。结论：建议全量推全红色按钮方案。预计下周完成全量上线。",
        highlights: ["红色按钮方案统计显著", "全量上线预计带来3%整体点击率提升"],
        risks: [],
        metricChanges: [],
      },
      {
        heading: "竞品动态", icon: "Target",
        content: "竞品A本周上线了类似我们的推送A/B测试功能；竞品B完成C轮融资，可能在Q3加大市场投放。建议关注竞品A的功能差异化方向，提前准备应对方案。",
        highlights: [],
        risks: [{ risk: "竞品B融资后可能加大市场投放，获客成本可能上升", severity: "中", mitigation: "提前准备差异化应对方案" }],
        metricChanges: [],
      },
      {
        heading: "用户反馈", icon: "MessageSquare",
        content: "本周共收集287条反馈，正面42%，中性38%，负面20%。主要负面反馈集中在：首屏加载慢（38条）、新手引导不清晰（25条）、推送频率过高（18条）。正面反馈多集中在：数据看板功能实用、界面简洁好上手。",
        highlights: ["数据看板上线后获得大量正面评价", "首屏加载慢是最集中的负面问题"],
        risks: [{ risk: "推送频率投诉增加", severity: "中", mitigation: "调整策略：降低普通用户推送频率" }],
        metricChanges: [],
      },
    ],
    nextWeekPlan: [
      { item: "启动首屏加载性能优化专项（目标<1.5s）", priority: "P0", rationale: "次日留存下降根因" },
      { item: "完成红色按钮方案全量推全", priority: "P0", rationale: "A/B实验统计显著，预计提升整体点击率3%" },
      { item: "618大促活动预热启动（6月10日）", priority: "P0", rationale: "下周最重要运营节点" },
      { item: "完成用户画像标签体系开发并提测", priority: "P1", rationale: "已延期2天，需赶上进度" },
      { item: "调整推送策略：降低普通用户推送频率至周2次", priority: "P1", rationale: "用户投诉增加" },
    ],
    overallMood: "neutral",
    keyTakeaways: [
      "DAU增长趋势向好，但留存下降需重点关注",
      "推送策略优化效果显著，可进一步精细化",
      "618大促是下周最重要的运营节点，确保顺利启动",
    ],
  };
}

export function WeeklyReport() {
  const [period, setPeriod] = useState("本周");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["metrics", "requirements", "activities", "experiments", "competitor", "feedback"]);
  const [customNotes, setCustomNotes] = useState("");

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (i: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const allModules = [
    { key: "metrics", label: "核心指标", icon: "📈" },
    { key: "requirements", label: "需求进度", icon: "📄" },
    { key: "activities", label: "运营活动", icon: "📢" },
    { key: "experiments", label: "A/B实验", icon: "🧪" },
    { key: "competitor", label: "竞品动态", icon: "🎯" },
    { key: "feedback", label: "用户反馈", icon: "💬" },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setIsDemo(false);

    try {
      const apiKey = getUserApiKey();
      if (!apiKey) {
        const demo = getDemoReport(period === "自定义" ? `${customStart} ~ ${customEnd}` : period);
        setReport(demo);
        setIsDemo(true);
        setLoading(false);
        return;
      }

      // Aggregate data from all modules
      const reportPeriod = period === "自定义" ? `${customStart} ~ ${customEnd}` : period;

      const poolReqs = getPoolRequirements();
      const activities = getActivities();
      const experiments = getExperiments();
      const competitors = getCompetitorHistory();
      const feedbacks = getFeedbackHistory();
      const metrics = getUploadedMetrics();

      const data: Record<string, unknown> = {
        period: reportPeriod,
      };

      if (selectedModules.includes("metrics")) {
        data.metrics = metrics.slice(0, 5).flatMap(m => {
          if (m.values.length < 2) return [];
          const last = m.values[m.values.length - 1];
          const prev = m.values[m.values.length - 2];
          const change = prev ? ((last - prev) / prev * 100).toFixed(1) + "%" : "N/A";
          const trend = prev && last > prev ? "up" : prev && last < prev ? "down" : "stable";
          return [{ label: m.label, current: String(last), change, trend }];
        });
      }

      if (selectedModules.includes("requirements")) {
        data.requirements = poolReqs.slice(0, 20).map(r => ({
          title: r.title, status: r.status, priority: r.priority,
        }));
      }

      if (selectedModules.includes("activities")) {
        data.activities = activities.slice(0, 10).map(a => ({
          name: a.name, status: a.status, participants: a.participants, conversionRate: a.conversionRate,
        }));
      }

      if (selectedModules.includes("experiments")) {
        data.experiments = experiments.slice(0, 10).map(e => ({
          name: e.name, status: e.status, conclusion: e.conclusion,
        }));
      }

      if (selectedModules.includes("competitor")) {
        const latest = competitors[0];
        data.competitorUpdates = latest ? `${latest.competitors}: ${latest.summary}` : "";
      }

      if (selectedModules.includes("feedback")) {
        const recent = feedbacks.slice(0, 20);
        const pos = recent.filter(f => f.sentiment === "positive").length;
        const neg = recent.filter(f => f.sentiment === "negative").length;
        data.feedbackSummary = recent.length > 0
          ? `共${recent.length}条，正面${pos}条(${(pos/recent.length*100).toFixed(0)}%)，负面${neg}条(${(neg/recent.length*100).toFixed(0)}%)`
          : "";
      }

      if (customNotes.trim()) {
        data.customNotes = customNotes.trim();
      }

      const res = await fetch("/api/weekly-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, data }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.report) { setReport(result.report); setLoading(false); return; }
      }
      throw new Error("生成失败");
    } catch {
      const demo = getDemoReport(period === "自定义" ? `${customStart} ~ ${customEnd}` : period);
      setReport(demo);
      setIsDemo(true);
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!report) return;
    let text = `# ${report.title}\n\n`;
    text += `## 执行摘要\n${report.executiveSummary}\n\n`;
    for (const s of report.sections) {
      text += `## ${iconMap[s.icon] || ""} ${s.heading}\n${s.content}\n\n`;
      if (s.highlights.length) text += `亮点:\n${s.highlights.map(h => `- ${h}`).join("\n")}\n\n`;
      if (s.risks.length) text += `风险:\n${s.risks.map(r => `- ${typeof r === "string" ? r : r.risk}`).join("\n")}\n\n`;
    }
    text += `## 下周计划\n${report.nextWeekPlan.map((p, i) => `${i + 1}. ${typeof p === "string" ? p : p.item}`).join("\n")}\n`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Config Card */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">AI 周报生成</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Period selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">报告周期</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              <option value="本周">本周</option>
              <option value="上周">上周</option>
              <option value="本月">本月</option>
              <option value="上月">上月</option>
              <option value="自定义">自定义范围</option>
            </select>
          </div>

          {period === "自定义" && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">开始日期</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">结束日期</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30" />
              </div>
            </>
          )}
        </div>

        {/* Module selector */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">包含模块</label>
          <div className="flex flex-wrap gap-2">
            {allModules.map((mod) => (
              <button
                key={mod.key}
                onClick={() => {
                  setSelectedModules(prev =>
                    prev.includes(mod.key) ? prev.filter(k => k !== mod.key) : [...prev, mod.key]
                  );
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedModules.includes(mod.key)
                    ? "bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500/30 dark:text-violet-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-500"
                }`}
              >
                {mod.icon} {mod.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom notes */}
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">补充说明（可选）</label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="本周特殊事项、需要重点说明的内容..."
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-700 font-medium mb-1">生成失败</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />AI 正在生成周报...</> : <><Sparkles className="w-4 h-4" />生成周报</>}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-10 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
          <span className="text-sm text-gray-500">AI 正在聚合各模块数据，生成周报...</span>
        </div>
      )}

      {/* Report result */}
      {report && !loading && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{report.title}</h2>
                  {isDemo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-medium">演示</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{report.period}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  report.overallMood === "positive" ? "bg-emerald-100 text-emerald-700" :
                  report.overallMood === "urgent" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {report.overallMood === "positive" ? "向好" : report.overallMood === "urgent" ? "需关注" : "正常"}
                </span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "已复制" : "复制全文"}
                </button>
              </div>
            </div>

            {/* Executive summary */}
            <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">执行摘要</p>
              {typeof report.executiveSummary === "string" ? (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{report.executiveSummary}</p>
              ) : (
                <div className="space-y-2">
                  {report.executiveSummary.headline && <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.executiveSummary.headline}</p>}
                  {report.executiveSummary.overallAssessment && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{report.executiveSummary.overallAssessment}</p>}
                  {report.executiveSummary.topFindings?.length && (
                    <div className="flex flex-wrap gap-1.5">
                      {report.executiveSummary.topFindings.map((f, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400">{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key takeaways */}
            {(report.keyTakeaways?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {report.keyTakeaways.map((k, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">
                    {i + 1}. {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(report.sections ?? []).map((section, i) => (
              <div key={i}>
                <button
                  onClick={() => toggleSection(i)}
                  className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-lg">{iconMap[section.icon] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{section.heading}</h4>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                      {section.highlights.length > 0 && `亮点 ${section.highlights.length} 条`}
                      {section.risks.length > 0 && ` · 风险 ${section.risks.length} 条`}
                      {section.metricChanges.length > 0 && ` · 指标 ${section.metricChanges.length} 项`}
                    </p>
                  </div>
                  {expandedSections.has(i) ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {expandedSections.has(i) && (
                  <div className="px-6 pb-4 space-y-3 animate-fade-in">
                    {section.content && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{section.content}</p>}
                    {section.situation && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-medium">现状：</span>{section.situation}</p>}
                    {section.analysis && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-medium">分析：</span>{section.analysis}</p>}
                    {section.implications && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"><span className="font-medium">影响：</span>{section.implications}</p>}

                    {/* Metric changes */}
                    {section.metricChanges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {section.metricChanges.map((m, j) => (
                          <div key={j} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                            <div className="text-[10px] text-gray-400">{m.label}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{m.current}</span>
                              <span className={`text-[10px] font-medium ${
                                m.trend === "up" ? "text-emerald-600" : m.trend === "down" ? "text-red-600" : "text-gray-400"
                              }`}>{m.change}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Highlights */}
                    {section.highlights.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">亮点</p>
                        {section.highlights.map((h, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                            <span className="mt-0.5">✅</span> {h}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Risks */}
                    {section.risks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">风险</p>
                        {section.risks.map((r, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-xs mb-1 last:mb-0">
                            <span className="mt-0.5">{(r.severity || "") === "高" ? "🔴" : (r.severity || "") === "中" ? "🟡" : "⚠️"}</span>
                            <div>
                              <span className="text-amber-800 dark:text-amber-300 font-medium">{typeof r === "string" ? r : r.risk}</span>
                              {typeof r !== "string" && r.mitigation && <span className="text-amber-500 ml-2">{r.mitigation}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Next week plan */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">下周重点计划</h4>
            <div className="space-y-2">
              {(report.nextWeekPlan ?? []).map((plan, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={cn(
                    "text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0",
                    plan.priority === "P0" ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" :
                    plan.priority === "P1" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    {plan.priority || `${i + 1}`}
                  </span>
                  <div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{typeof plan === "string" ? plan : plan.item}</span>
                    {typeof plan !== "string" && plan.rationale && (
                      <p className="text-xs text-gray-400 mt-0.5">{plan.rationale}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">AI 自动聚合各模块数据生成周报</p>
          <p className="text-gray-400 text-xs">选择报告周期和模块，一键生成专业周报</p>
        </div>
      )}
    </div>
  );
}
