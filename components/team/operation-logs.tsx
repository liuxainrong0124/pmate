"use client";

import { useState, useMemo } from "react";
import { getLogs, clearLogs } from "@/lib/store/local-store";
import type { StoredLog } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Clock, FileText } from "lucide-react";

const typeBadgeColors: Record<string, string> = {
  "创建": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  "删除": "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  "编辑": "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  "发布": "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
};

function getTypeBadgeColor(type: string): string {
  return typeBadgeColors[type] || "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  } catch { return iso; }
}

export function OperationLogs() {
  const [logs, setLogs] = useState<StoredLog[]>(getLogs());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refresh = () => setLogs([...getLogs()]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      if (dateFrom && log.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && log.createdAt.slice(0, 10) > dateTo) return false;
      return true;
    });
  }, [logs, typeFilter, dateFrom, dateTo]);

  const handleClear = () => {
    clearLogs();
    showToast("操作日志已清空", "success");
    setShowClearConfirm(false);
    refresh();
  };

  const allTypes = useMemo(() => {
    const types = new Set(logs.map(l => l.type));
    return Array.from(types);
  }, [logs]);

  const hasFilters = typeFilter !== "all" || dateFrom !== "" || dateTo !== "";

  return (
    <div>
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "")}>
          <SelectTrigger size="sm" className="w-[120px]">
            <SelectValue placeholder="操作类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {allTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          <span className="text-xs text-gray-400">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex-1" />

        {hasFilters && (
          <button
            onClick={() => { setTypeFilter("all"); setDateFrom(""); setDateTo(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            清除筛选
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowClearConfirm(!showClearConfirm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空日志
          </button>
          {showClearConfirm && (
            <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg z-10 whitespace-nowrap">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">确定清空所有操作日志？</p>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  确定
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">暂无操作记录</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">操作人</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">操作时间</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">操作类型</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">操作对象</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{log.operator}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatTime(log.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(log.type)}`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.target}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[200px] truncate">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
