"use client";

import { useState, useEffect } from "react";
import { getLogs, clearLogs, StoredLog } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { Clock, Trash2, Search, FileText, Users, BarChart3, Megaphone } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  create: <FileText className="w-3.5 h-3.5" />,
  update: <FileText className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  status_change: <BarChart3 className="w-3.5 h-3.5" />,
  comment: <Users className="w-3.5 h-3.5" />,
  push: <Megaphone className="w-3.5 h-3.5" />,
};

const typeColors: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  status_change: "bg-amber-100 text-amber-700",
  comment: "bg-violet-100 text-violet-700",
  push: "bg-rose-100 text-rose-700",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [loaded, setLoaded] = useState(false);

  const refresh = () => setLogs(getLogs());

  useEffect(() => {
    refresh();
    setLoaded(false);
    // Small delay for fade-in
    const timer = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClear = () => {
    if (!confirm("确定清空所有操作日志吗？此操作不可撤销。")) return;
    clearLogs();
    refresh();
    showToast("日志已清空", "success");
  };

  const filtered = logs.filter((l) => {
    if (search && !l.detail.toLowerCase().includes(search.toLowerCase()) && !l.operator.toLowerCase().includes(search.toLowerCase()) && !l.target.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    return true;
  });

  const uniqueTypes = Array.from(new Set(logs.map((l) => l.type)));

  return (
    <div className={`max-w-[960px] mx-auto px-6 py-8 transition-all duration-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">操作日志</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">最近 200 条操作记录</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空日志
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="搜索操作人、目标或详情..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 pl-9 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          <option value="all">全部类型</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Log list */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">暂无日志记录</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">执行操作后将自动生成日志</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3 w-[160px]">时间</th>
                  <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3 w-[80px]">类型</th>
                  <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3 w-[100px]">操作人</th>
                  <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">目标</th>
                  <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">详情</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {new Date(log.createdAt).toLocaleString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColors[log.type] || "bg-gray-100 text-gray-600"}`}>
                        {typeIcons[log.type]}
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-medium text-gray-600 dark:text-gray-300 shrink-0">
                          {log.operator[0] || "?"}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{log.operator}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{log.target}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">{log.detail}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          共 {logs.length} 条记录 · 显示 {filtered.length} 条 · 最多保留 200 条
        </p>
      </div>
    </div>
  );
}
