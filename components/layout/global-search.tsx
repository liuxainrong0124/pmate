"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, FileText, BarChart3, Users, Megaphone,
  TrendingUp, Settings, CornerDownLeft, X, MessageSquare,
} from "lucide-react";
import { getPoolRequirements } from "@/lib/store/local-store";
import { getFeedbackHistory } from "@/lib/store/local-store";

interface SearchItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  group: string;
  action: () => void;
}

const STATIC_ROUTES: Omit<SearchItem, "action">[] = [
  { id: "dashboard", label: "仪表盘", desc: "关键指标概览与快捷入口", icon: <LayoutDashboard className="w-4 h-4" />, group: "页面导航" },
  { id: "requirements", label: "需求中心", desc: "PRD编辑器、需求池、异常场景生成", icon: <FileText className="w-4 h-4" />, group: "页面导航" },
  { id: "data", label: "数据洞察", desc: "指标看板、异动归因、对比分析", icon: <BarChart3 className="w-4 h-4" />, group: "页面导航" },
  { id: "users", label: "用户中心", desc: "用户分层、画像生成、反馈聚合", icon: <Users className="w-4 h-4" />, group: "页面导航" },
  { id: "operations", label: "运营中心", desc: "内容生成、推送策略", icon: <Megaphone className="w-4 h-4" />, group: "页面导航" },
  { id: "competitor", label: "竞品追踪", desc: "竞品分析报告", icon: <TrendingUp className="w-4 h-4" />, group: "页面导航" },
  { id: "settings", label: "设置", desc: "API 密钥、通知偏好、团队管理", icon: <Settings className="w-4 h-4" />, group: "页面导航" },
  { id: "feedback", label: "反馈分析", desc: "用户反馈收集与分析", icon: <MessageSquare className="w-4 h-4" />, group: "页面导航" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Build dynamic data items
  const getDynamicItems = useCallback((): Omit<SearchItem, "action">[] => {
    const items: Omit<SearchItem, "action">[] = [];

    try {
      const reqs = getPoolRequirements();
      for (const req of reqs) {
        items.push({
          id: `req-${req.id}`,
          label: req.title,
          desc: `${req.module || "需求池"} · ${req.status === "planning" ? "规划中" : req.status === "in_progress" ? "进行中" : req.status === "review" ? "评审中" : req.status === "done" ? "已完成" : "待定"} · ${req.priority.toUpperCase()}`,
          icon: <FileText className="w-4 h-4" />,
          group: "需求池",
        });
      }
    } catch { /* ignore */ }

    try {
      const fbs = getFeedbackHistory();
      for (const fb of fbs) {
        items.push({
          id: `fb-${fb.id}`,
          label: fb.quote || fb.title,
          desc: `${fb.sentiment === "positive" ? "正面" : fb.sentiment === "negative" ? "负面" : "中性"} · ${fb.source}`,
          icon: <MessageSquare className="w-4 h-4" />,
          group: "用户反馈",
        });
      }
    } catch { /* ignore */ }

    return items;
  }, []);

  // Filter items based on query
  const results = useCallback((): SearchItem[] => {
    const allStatic = STATIC_ROUTES.map(r => ({
      ...r,
      action: () => { router.push(`/${r.id === "dashboard" ? "" : r.id}`); setOpen(false); },
    }));

    const allDynamic = getDynamicItems().map(r => ({
      ...r,
      action: () => {
        if (r.id.startsWith("req-")) {
          router.push("/requirements");
        } else if (r.id.startsWith("fb-")) {
          router.push("/users");
        }
        setOpen(false);
      },
    }));

    const all = [...allStatic, ...allDynamic];

    if (!query.trim()) return all.slice(0, 8);

    const q = query.toLowerCase();
    return all.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query, getDynamicItems, router]);

  const filtered = results();

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
        return;
      }

      if (!open) return;

      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selectedIndex]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Group results
  const grouped = new Map<string, SearchItem[]>();
  for (const item of filtered) {
    const g = grouped.get(item.group) || [];
    g.push(item);
    grouped.set(item.group, g);
  }

  return (
    <>
      {/* Trigger hint — shown in sidebar area or as small floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
          bg-gray-100 dark:bg-gray-800 text-xs text-gray-400
          hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300
          transition-colors cursor-pointer w-full max-w-[200px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">搜索...</span>
        <kbd className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-[540px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in mx-4">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索页面、需求、反馈..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400
                  outline-none border-none focus:outline-none focus:ring-0"
              />
              <kbd className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-gray-400 shrink-0">
                <CornerDownLeft className="w-3 h-3 inline" />
              </kbd>
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">未找到匹配结果</p>
                </div>
              ) : (
                Array.from(grouped.entries()).map(([group, items]) => (
                  <div key={group} className="mb-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      {group}
                    </div>
                    {items.map((item) => {
                      const globalIdx = filtered.indexOf(item);
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => item.action()}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isSelected
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <span className="text-gray-400 shrink-0">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium block truncate">{item.label}</span>
                            <span className="text-[10px] text-gray-400 block truncate">{item.desc}</span>
                          </div>
                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">↑↓</kbd> 导航
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">Enter</kbd> 打开
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">Esc</kbd> 关闭
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
