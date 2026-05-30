"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { GlowCard } from "@/components/effects/glow-card";
import { AmbientBackground } from "@/components/effects/ambient-background";
import { MetricData, emptyMetrics, emptyAlerts } from "@/lib/mock/dashboard-data";
import { getUploadedMetrics, getSettings, getTodos, toggleTodo as toggleTodoStore, deleteTodo, addTodo, StoredTodo } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { ArrowRight, AlertTriangle, Info, Clock, FileText, BarChart3, Users, Megaphone, Search, Check, Upload, Plus, Trash2, X } from "lucide-react";

const quickActions = [
  { href: "/requirements", label: "写 PRD", icon: FileText, gradient: "from-violet-500 to-indigo-500" },
  { href: "/data", label: "看数据", icon: BarChart3, gradient: "from-emerald-500 to-teal-500" },
  { href: "/operations", label: "做推送", icon: Megaphone, gradient: "from-amber-500 to-orange-500" },
  { href: "/users", label: "用户洞察", icon: Users, gradient: "from-blue-500 to-cyan-500" },
  { href: "/knowledge", label: "知识库", icon: Search, gradient: "from-rose-500 to-pink-500" },
];

function HeroGlow() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setPos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[180px] transition-transform duration-1000 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          left: `${pos.x * 100 - 20}%`,
          top: `${pos.y * 100 - 20}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[150px] transition-transform duration-1500 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
          right: `${(1 - pos.x) * 100 - 10}%`,
          bottom: `${(1 - pos.y) * 100 - 10}%`,
          transform: "translate(50%, 50%)",
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricData[]>(emptyMetrics);
  const [todos, setTodoState] = useState<StoredTodo[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [hasUploadedData, setHasUploadedData] = useState(false);
  const userName = getSettings().userName || "Pulse 用户";
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return `早上好，${userName}`;
    if (hour < 18) return `下午好，${userName}`;
    return `晚上好，${userName}`;
  };

  const toggleTodo = (id: string) => {
    toggleTodoStore(id);
    setTodoState(getTodos());
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo(id);
    setTodoState(getTodos());
    showToast("待办已删除", "success");
  };

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    addTodo({ text: newTodoText.trim(), time: "今日", done: false, priority: "medium" });
    setTodoState(getTodos());
    setNewTodoText("");
    setShowAddTodo(false);
    showToast("待办已添加", "success");
  };

  useEffect(() => {
    // Load todos from localStorage
    setTodoState(getTodos());

    const uploaded = getUploadedMetrics();
    if (uploaded.length === 0) return;
    setHasUploadedData(true);
    const merged = [...emptyMetrics];
    for (const s of uploaded) {
      const values = s.values;
      const last = values[values.length - 1] ?? 0;
      const prevLen = Math.min(10, values.length);
      const start = Math.max(0, values.length - prevLen);
      const prev = values.length >= 8 ? values[values.length - 8] ?? last : values[0] ?? last;
      const change = prev !== 0 ? Math.round(((last - prev) / Math.abs(prev)) * 1000) / 10 : 0;
      const sparkline = values.slice(start);
      const converted: MetricData = {
        label: s.label,
        value: last >= 1000 ? `${(last / 1000).toFixed(1)}k` : String(Math.round(last * 10) / 10),
        change,
        trend: change >= 0 ? "up" : "down",
        sparkline: sparkline.length > 0 ? sparkline : [0],
      };
      const idx = merged.findIndex(m => m.label === s.label);
      if (idx >= 0) merged[idx] = converted;
    }
    setMetrics(merged);
  }, []);

  return (
    <div className="relative">
      <AmbientBackground />
      <HeroGlow />

      <div className="relative z-10 max-w-[1120px] mx-auto px-6 py-8">
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[32px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {getGreeting()}
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{dateStr}</p>
        </div>

        {!hasUploadedData && (
          <div className="mb-6 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 p-5 flex items-start gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-indigo-900 dark:text-indigo-300 mb-1">连接你的数据源</h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
                上传 CSV 文件或接入数据库，Pulse 将自动生成指标卡片、异动归因和趋势分析。当前指标显示为占位符。
              </p>
              <Link
                href="/data"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                前往数据洞察上传
              </Link>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {metrics.map((m, i) => (
            <GlowCard key={m.label} glowColor={m.trend === "up" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)"}>
              <MetricCard metric={m} delay={i * 80} />
            </GlowCard>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <GlowCard glowColor="rgba(245,158,11,0.1)" className="rounded-2xl">
            <div className="rounded-2xl glass p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">今日待办</h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto font-medium">{todos.filter(t => !t.done).length} 项</span>
              </div>
              {todos.length === 0 ? (
                <div className="py-8 text-center empty-state">
                  <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">今天可以休息一下 ☕️</p>
                </div>
              ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-start gap-3 group w-full text-left list-item-hover rounded-lg p-1.5 -mx-1.5">
                    <button onClick={() => toggleTodo(todo.id)} className={`w-5 h-5 rounded-md border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                      todo.done
                        ? "bg-emerald-500 border-emerald-500"
                        : todo.priority === "high"
                          ? "border-red-300 group-hover:border-red-400"
                          : "border-amber-300 group-hover:border-amber-400"
                    }`}>
                      {todo.done && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm transition-colors leading-relaxed ${todo.done ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"}`}>{todo.text}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{todo.time}</p>
                    </div>
                    <button onClick={() => handleDeleteTodo(todo.id)} className="p-1 rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              )}
              {/* Add todo */}
              {showAddTodo ? (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddTodo(); if (e.key === "Escape") setShowAddTodo(false); }}
                    placeholder="输入待办内容..."
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button onClick={handleAddTodo} className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors">添加</button>
                  <button onClick={() => setShowAddTodo(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => setShowAddTodo(true)} className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> 新增待办
                </button>
              )}
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(99,102,241,0.1)" className="rounded-2xl">
            <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-6 shadow-sm animate-fade-in" style={{ animationDelay: "180ms" }}>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-5">快捷入口</h3>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2.5 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br ${action.gradient} shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 group-hover:-translate-y-1`}>
                      <action.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="rgba(245,158,11,0.08)" className="rounded-2xl">
            <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-6 shadow-sm animate-fade-in" style={{ animationDelay: "260ms" }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">异常提醒</h3>
              </div>
              {emptyAlerts.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">暂无异常提醒</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">上传指标数据后，Pulse 将自动检测异动并生成提醒</p>
                </div>
              ) : (
              <div className="space-y-3">
                {emptyAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-xl border text-sm transition-all duration-200 hover:shadow-sm hover:scale-[1.02] ${alert.severity === "warning" ? "bg-amber-50/40 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20" : "bg-blue-50/40 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"}`}>
                    <div className="flex items-start gap-2.5">
                      {alert.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /> : <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{alert.text}</p>
                    </div>
                    <Link href="/data" className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                      {alert.action} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
              )}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
