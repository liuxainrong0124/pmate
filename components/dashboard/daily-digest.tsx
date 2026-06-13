"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserApiKey, getTodos, getPoolRequirements, getObjectives, getCompetitorUpdateCount, clearCompetitorUpdateCount, getSettings } from "@/lib/store/local-store";
import { getAlertHistory } from "@/lib/alert";
import { getUploadedMetrics } from "@/lib/store/local-store";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

interface HighlightItem {
  point: string;
  indicator: "good" | "warning" | "info";
  detail: string;
}

interface RiskItem {
  risk: string;
  severity: "high" | "medium";
  action: string;
}

interface ScheduleItem {
  priority: number;
  task: string;
  reason: string;
  duration: string;
}

interface DigestData {
  greeting: string;
  headline?: string;
  summary: string;
  highlights?: HighlightItem[];
  risks?: RiskItem[];
  schedule?: ScheduleItem[];
  mood: "positive" | "neutral" | "urgent";
  moodReason?: string;
}

export function DailyDigest() {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDigest = useCallback(async () => {
    const apiKey = getUserApiKey();
    if (!apiKey) {
      setError("请先在设置中配置 API Key");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const settings = getSettings();
      const todos = getTodos();
      const reqs = getPoolRequirements();
      const objectives = getObjectives();
      const alerts = getAlertHistory();
      const competitorUpdates = getCompetitorUpdateCount();

      // Build metrics from localStorage
      const uploaded = getUploadedMetrics();
      const metrics = uploaded.length > 0
        ? uploaded.map(s => {
            const vals = s.values;
            const last = vals[vals.length - 1] ?? 0;
            const prev = vals.length >= 8 ? vals[vals.length - 8] ?? last : vals[0] ?? last;
            const change = prev !== 0 ? Math.round(((last - prev) / Math.abs(prev)) * 1000) / 10 : 0;
            return { label: s.label, value: String(last), change, trend: change >= 0 ? "up" : "down" };
          })
        : [
            { label: "DAU", value: "12,000", change: 3.2, trend: "up" },
            { label: "次日留存", value: "38%", change: -1.5, trend: "down" },
            { label: "推送打开率", value: "28%", change: 5.1, trend: "up" },
            { label: "LTV", value: "28.5", change: 2.0, trend: "up" },
          ];

      const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
      const overdue = reqs.filter(r => r.dueDate && r.dueDate < new Date().toISOString().slice(0, 10) && r.status !== "done" && r.status !== "backlog");
      const pendingTodos = todos.filter(t => !t.done);
      const atRiskOkrs = objectives.filter(o => o.status === "active" && o.progress < 40);

      const data = {
        date: today,
        userName: settings.userName || "Pulse 用户",
        metrics,
        todos: { done: todos.filter(t => t.done).length, total: todos.length, pending: pendingTodos.slice(0, 3).map(t => t.text) },
        requirements: { total: reqs.length, inProgress: reqs.filter(r => r.status === "in_progress").length, overdue: overdue.length, pendingApproval: reqs.filter(r => (r as { approvalStatus?: string }).approvalStatus === "pending").length },
        okr: { active: objectives.filter(o => o.status === "active").length, avgProgress: objectives.length > 0 ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length) : 0, atRisk: atRiskOkrs.map(o => o.title) },
        competitorUpdates,
        alerts: alerts.length,
      };

      const res = await fetch("/api/daily-digest/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, data }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        if (res.status === 401) {
          throw new Error("API Key 无效，请在设置中重新获取 DeepSeek API Key（platform.deepseek.com）");
        }
        throw new Error(err.error || `请求失败 (${res.status})`);
      }

      const result = await res.json();
      setDigest(result.digest);
      clearCompetitorUpdateCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generateDigest();
  }, []);

  const moodConfig = {
    positive: { bg: "from-emerald-50 to-teal-50 border-emerald-100", icon: CheckCircle2, iconColor: "text-emerald-500" },
    neutral: { bg: "from-blue-50 to-indigo-50 border-blue-100", icon: Sparkles, iconColor: "text-blue-500" },
    urgent: { bg: "from-amber-50 to-orange-50 border-amber-100", icon: AlertTriangle, iconColor: "text-amber-500" },
  };

  const config = digest ? moodConfig[digest.mood] : moodConfig.neutral;
  const MoodIcon = config.icon;

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${config.bg} p-5 animate-fade-in`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MoodIcon className={`w-5 h-5 ${config.iconColor}`} />
          <h3 className="font-semibold text-sm text-gray-900">AI 智能日报</h3>
        </div>
        <button
          onClick={generateDigest}
          disabled={loading}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors disabled:opacity-50"
          title="刷新日报"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-500">AI 正在分析今日数据...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button onClick={generateDigest} className="text-xs text-violet-600 hover:text-violet-800 font-medium">重试</button>
        </div>
      )}

      {digest && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">{digest.summary}</p>

          {digest.highlights && digest.highlights.length > 0 && (
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs font-medium text-gray-700 mb-1.5">关键动态</p>
              {digest.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs mb-1 last:mb-0">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    h.indicator === "good" && "bg-emerald-400",
                    h.indicator === "warning" && "bg-amber-400",
                    h.indicator === "info" && "bg-blue-400"
                  )} />
                  <div>
                    <span className="text-gray-800 font-medium">{h.point}</span>
                    <span className="text-gray-400 ml-2">{h.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {digest.risks && digest.risks.length > 0 && (
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs font-medium text-amber-700 mb-1.5">需要关注</p>
              {digest.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs mb-1 last:mb-0">
                  <AlertTriangle className={cn(
                    "w-3 h-3 shrink-0 mt-0.5",
                    r.severity === "high" ? "text-red-400" : "text-amber-400"
                  )} />
                  <div>
                    <span className="text-amber-800 font-medium">{r.risk}</span>
                    <span className="text-amber-500 ml-2">{r.action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {digest.schedule && digest.schedule.length > 0 && (
            <div className="rounded-xl bg-white/60 p-3">
              <p className="text-xs font-medium text-gray-700 mb-1.5">今日优先事项</p>
              {digest.schedule.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs mb-1.5 last:mb-0">
                  <span className="font-bold text-violet-500 shrink-0 mt-0.5">{s.priority}.</span>
                  <div>
                    <span className="text-gray-800 font-medium">{s.task}</span>
                    <span className="text-gray-400 ml-1">({s.duration})</span>
                    <p className="text-gray-400 text-[11px]">{s.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
