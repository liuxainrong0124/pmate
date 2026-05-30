"use client";

import { useState, useEffect } from "react";
import { getFeedbackHistory, StoredFeedback } from "@/lib/store/local-store";
import { MessageSquare, TrendingUp, Smile, Frown, Meh, ExternalLink } from "lucide-react";
import Link from "next/link";

const sentimentConfig = {
  positive: { icon: Smile, color: "text-emerald-500", bg: "bg-emerald-50", label: "正面" },
  neutral: { icon: Meh, color: "text-amber-500", bg: "bg-amber-50", label: "中性" },
  negative: { icon: Frown, color: "text-red-500", bg: "bg-red-50", label: "负面" },
};

const DEFAULT_FEEDBACK: StoredFeedback[] = [
  { id: "d1", title: "首页加载速度", feedbackText: "", sentiment: "negative", quote: "打开首页要等3-4秒，太慢了", category: "Bug", source: "App Store", date: "2026-05-25" },
  { id: "d2", title: "深色模式", feedbackText: "", sentiment: "positive", quote: "终于有深色模式了，眼睛舒服多了", category: "功能需求", source: "用户反馈群", date: "2026-05-24" },
  { id: "d3", title: "推送太频繁", feedbackText: "", sentiment: "negative", quote: "一天推3条，有点烦了", category: "体验问题", source: "NPS调研", date: "2026-05-23" },
  { id: "d4", title: "会员价格", feedbackText: "", sentiment: "neutral", quote: "会员价格还行，希望能有学生优惠", category: "咨询", source: "用户反馈群", date: "2026-05-22" },
  { id: "d5", title: "搜索功能", feedbackText: "", sentiment: "positive", quote: "搜索比以前准多了，好评！", category: "体验问题", source: "App Store", date: "2026-05-21" },
  { id: "d6", title: "闪退问题", feedbackText: "", sentiment: "negative", quote: "iOS 15 打开就闪退，完全用不了", category: "Bug", source: "App Store", date: "2026-05-20" },
  { id: "d7", title: "新功能建议", feedbackText: "", sentiment: "positive", quote: "建议增加笔记导出PDF功能", category: "功能需求", source: "用户反馈群", date: "2026-05-19" },
  { id: "d8", title: "引导流程", feedbackText: "", sentiment: "neutral", quote: "新手引导有点长，能否跳过", category: "体验问题", source: "NPS调研", date: "2026-05-18" },
];

export function FeedbackAggregation() {
  const [sentFilter, setSentFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<StoredFeedback[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = getFeedbackHistory();
    // Merge stored with defaults, stored first
    const storedIds = new Set(stored.map(f => f.id));
    const merged = [...stored, ...DEFAULT_FEEDBACK.filter(f => !storedIds.has(f.id))];
    setFeedback(merged);
    setLoaded(true);
  }, []);

  const filtered = sentFilter === "all"
    ? feedback
    : feedback.filter((f) => f.sentiment === sentFilter);

  const posCount = feedback.filter(f => f.sentiment === "positive").length;
  const neuCount = feedback.filter(f => f.sentiment === "neutral").length;
  const negCount = feedback.filter(f => f.sentiment === "negative").length;
  const total = feedback.length || 1;
  const posPct = Math.round((posCount / total) * 100);
  const neuPct = Math.round((neuCount / total) * 100);
  const negPct = Math.round((negCount / total) * 100);

  if (!loaded) return null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["positive", "neutral", "negative"] as const).map((sent) => {
          const config = sentimentConfig[sent];
          const Icon = config.icon;
          const pct = sent === "positive" ? posPct : sent === "neutral" ? neuPct : negPct;
          return (
            <button
              key={sent}
              onClick={() => setSentFilter(sentFilter === sent ? "all" : sent)}
              className={`rounded-2xl border p-5 text-left transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                sentFilter === sent
                  ? "border-gray-300 bg-white shadow-md"
                  : "border-gray-100 bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{pct}%</span>
              </div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{config.label}反馈</p>
              <div className="w-full h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${sent === "positive" ? "bg-emerald-400" : sent === "neutral" ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-gray-900">反馈总量: {feedback.length} 条</span>
          {feedback.length > DEFAULT_FEEDBACK.length && (
            <span className="text-xs text-emerald-600 font-medium">+{feedback.length - DEFAULT_FEEDBACK.length} 条新增</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>来自: App Store · 用户反馈群 · NPS 调研 · 手动输入</span>
          <Link
            href="/feedback"
            className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            深度分析 <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Feedback List */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-sm text-gray-900">最新反馈</h3>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} 条</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
          {filtered.map((item) => {
            const config = sentimentConfig[item.sentiment];
            const Icon = config.icon;
            return (
              <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-medium text-gray-400 uppercase">{item.category}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{item.source}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{item.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400">暂无该类型的反馈</p>
          </div>
        )}
      </div>
    </div>
  );
}
