"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserApiKey, getMonitoredCompetitors, updateMonitoredCompetitorCheck, addMonitoredCompetitor, removeMonitoredCompetitor, toggleMonitoredCompetitor, getCompetitorUpdateCount, clearCompetitorUpdateCount, StoredMonitoredCompetitor } from "@/lib/store/local-store";
import { TrendingUp, Loader2, RefreshCw, ExternalLink, Bell, BellOff, Trash2, Plus, X, Settings } from "lucide-react";
import Link from "next/link";

interface CompetitorUpdate {
  competitor: string;
  news: { title: string; summary: string; category: string; impact: string; date: string }[];
}

interface MonitorResult {
  updates: CompetitorUpdate[];
  overallTrend: string;
  alerts: string[];
  newsHash: string;
  checkedAt: string;
}

export function CompetitorPulse() {
  const [monitored, setMonitored] = useState<StoredMonitoredCompetitor[]>([]);
  const [result, setResult] = useState<MonitorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const refreshMonitored = useCallback(() => {
    setMonitored(getMonitoredCompetitors());
  }, []);

  useEffect(() => { refreshMonitored(); }, [refreshMonitored]);

  const runMonitor = useCallback(async () => {
    const apiKey = getUserApiKey();
    if (!apiKey) {
      setError("请先在设置中配置 API Key");
      return;
    }
    const enabled = monitored.filter(c => c.enabled);
    if (enabled.length === 0) {
      setError("暂无启用的监控目标");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/competitor/auto-monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: enabled.map(c => c.name), apiKey }),
      });

      if (!res.ok) throw new Error(`请求失败 (${res.status})`);
      const data = await res.json();

      setResult(data);
      setLastChecked(data.checkedAt);

      // Update stored hash for each monitored competitor and detect changes
      for (const comp of enabled) {
        updateMonitoredCompetitorCheck(comp.id, data.newsHash);
      }

      clearCompetitorUpdateCount();
      refreshMonitored();
    } catch (err) {
      setError(err instanceof Error ? err.message : "监控检查失败");
    } finally {
      setLoading(false);
    }
  }, [monitored, refreshMonitored]);

  // Auto-run once on mount if there are monitored competitors
  useEffect(() => {
    const enabled = getMonitoredCompetitors().filter(c => c.enabled);
    if (enabled.length > 0) {
      // Only auto-run if last check was > 1 hour ago
      const lastCheck = enabled.reduce((latest, c) =>
        c.lastCheckedAt && c.lastCheckedAt > latest ? c.lastCheckedAt : latest, "");
      if (!lastCheck || Date.now() - new Date(lastCheck).getTime() > 3600000) {
        runMonitor();
      } else {
        setLastChecked(lastCheck);
      }
    }
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addMonitoredCompetitor({ name: newName.trim(), url: newUrl.trim() });
    setNewName("");
    setNewUrl("");
    setShowAdd(false);
    refreshMonitored();
  };

  const handleRemove = (id: string) => {
    removeMonitoredCompetitor(id);
    refreshMonitored();
  };

  const handleToggle = (id: string) => {
    toggleMonitoredCompetitor(id);
    refreshMonitored();
  };

  const categoryColors: Record<string, string> = {
    "产品更新": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    "融资并购": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    "战略合作": "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400",
    "人事变动": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    "市场扩张": "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
    "定价策略": "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400",
    "技术突破": "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">竞品动态监控</h3>
          {monitored.filter(c => c.enabled).length > 0 && (
            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {monitored.filter(c => c.enabled).length} 个目标
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {lastChecked && (
            <span className="text-[10px] text-gray-400 mr-2">
              上次检查: {new Date(lastChecked).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={runMonitor}
            disabled={loading || monitored.filter(c => c.enabled).length === 0}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="立即检查"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="添加监控目标"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="竞品名称"
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
            autoFocus
          />
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="网址（选填）"
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
          />
          <button onClick={handleAdd} className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors">添加</button>
          <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Monitored list */}
      {monitored.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {monitored.map(c => (
            <span
              key={c.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                c.enabled
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 line-through"
              }`}
            >
              <button onClick={() => handleToggle(c.id)} className="hover:text-amber-900 dark:hover:text-amber-300">
                {c.enabled ? <Bell className="w-2.5 h-2.5" /> : <BellOff className="w-2.5 h-2.5" />}
              </button>
              {c.name}
              <button onClick={() => handleRemove(c.id)} className="hover:text-red-500 ml-0.5">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          <span className="text-sm text-gray-500">正在检查竞品动态...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 mb-2">{error}</p>
          {monitored.filter(c => c.enabled).length === 0 && (
            <button onClick={() => setShowAdd(true)} className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              + 添加监控目标
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && monitored.length === 0 && (
        <div className="py-6 text-center">
          <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">添加竞品开始自动监控</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">AI 将定期检查竞品动态并生成变化摘要</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-amber-600 hover:text-amber-700 font-medium">
            + 添加监控目标
          </button>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Overall trend */}
          {result.overallTrend && (
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{result.overallTrend}</p>
          )}

          {/* Alerts */}
          {result.alerts.length > 0 && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3">
              <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1.5">需要关注</p>
              {result.alerts.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          )}

          {/* Per-competitor news */}
          {result.updates.length > 0 && (
            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {result.updates.map((comp) => (
                <div key={comp.competitor} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">{comp.competitor}</p>
                  <div className="space-y-1.5">
                    {comp.news.slice(0, 3).map((n, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{n.title}</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded ${categoryColors[n.category] || "bg-gray-100 text-gray-600"}`}>
                              {n.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{n.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer: go to competitor page */}
          <Link
            href="/competitor"
            className="flex items-center justify-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors"
          >
            前往竞品追踪 <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
