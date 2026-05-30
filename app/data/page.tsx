"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { MetricWithHistory } from "@/lib/mock/metrics-data";
import { AnomalyAttribution } from "@/components/data/anomaly-attribution";
import { DataUpload } from "@/components/data/data-upload";
import { getUploadedMetrics, StoredMetric } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import {
  BarChart3, TrendingUp, TrendingDown, Upload, AlertTriangle,
  Download, X, Calendar, LineChart, AreaChart
} from "lucide-react";

// ── Types ──
type TimeRange = "today" | "yesterday" | "week" | "month" | "custom";
type ChartType = "line" | "bar" | "area";
type Dimension = "channel" | "version" | "segment";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "today", label: "今日" },
  { value: "yesterday", label: "昨日" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
  { value: "custom", label: "自定义" },
];

const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: "channel", label: "渠道" },
  { value: "version", label: "版本" },
  { value: "segment", label: "用户群" },
];

// ── Seed-based pseudo-random ──
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Date generation ──
function generateDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ── Value formatting ──
function formatValue(v: number, unit: string, decimals: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}万`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  if (unit === "%") return `${(v * 100).toFixed(decimals)}%`;
  return String(Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals));
}

// ── Mock data generation (60-day history) ──
function generateMockMetric(
  id: string, label: string, unit: string,
  base: number, variance: number, decimals: number, seed: number
): MetricWithHistory {
  const rand = seededRandom(seed);
  const dates = generateDates(60);
  const values: number[] = [];
  for (let i = 0; i < 60; i++) {
    const seasonal = Math.sin((i / 60) * Math.PI * 2) * variance * 0.3;
    const noise = (rand() - 0.5) * variance;
    const trend = (i / 60) * variance * 0.1;
    const v = base + seasonal + noise + trend;
    const factor = Math.pow(10, decimals);
    values.push(Math.round(v * factor) / factor);
  }
  const last30 = values.slice(-30);
  const avg = last30.reduce((a, b) => a + b, 0) / last30.length;
  const prev30 = values.slice(0, 30);
  const prevAvg = prev30.length > 0 ? prev30.reduce((a, b) => a + b, 0) / prev30.length : avg;
  const change = prevAvg !== 0 ? ((avg - prevAvg) / Math.abs(prevAvg)) * 100 : 0;

  return {
    id,
    label,
    currentValue: formatValue(avg, unit, decimals),
    change: Math.round(change * 10) / 10,
    trend: change >= 0 ? "up" : "down",
    unit,
    benchmark: formatValue(prevAvg, unit, decimals),
    history: dates.map((d, i) => ({ date: d, value: values[i] })),
  };
}

function generateDefaultMockMetrics(): MetricWithHistory[] {
  return [
    generateMockMetric("dau", "DAU", "", 10000, 2200, 0, 1),
    generateMockMetric("retention", "次日留存", "%", 0.35, 0.08, 2, 2),
    generateMockMetric("ltv", "月LTV", "元", 25, 8, 0, 3),
    generateMockMetric("push_rate", "推送打开率", "%", 0.25, 0.06, 2, 4),
    generateMockMetric("conversion", "转化率", "%", 0.10, 0.03, 2, 5),
    generateMockMetric("churn", "周流失率", "%", 0.05, 0.02, 2, 6),
  ];
}

// ── Convert uploaded stored metric ──
function storedToMetric(s: StoredMetric): MetricWithHistory {
  const values = s.values;
  const last = values[values.length - 1] ?? 0;
  const prev = values.length >= 8 ? values[values.length - 8] ?? last : values[0] ?? last;
  const change = prev !== 0 ? ((last - prev) / Math.abs(prev)) * 100 : 0;
  return {
    id: s.id,
    label: s.label,
    currentValue: last >= 1000 ? `${(last / 1000).toFixed(1)}k` : String(Math.round(last * 10) / 10),
    change: Math.round(change * 10) / 10,
    trend: change >= 0 ? "up" : "down",
    unit: "",
    benchmark: String(Math.round(values.slice(0, Math.max(1, values.length - 7)).reduce((a: number, b: number) => a + b, 0) / Math.max(1, values.length - 7) * 10) / 10),
    history: s.dates.map((d, i) => ({ date: d, value: values[i] ?? 0 })),
  };
}

// ── Compute display values based on selected time range ──
function computeDisplay(
  metric: MetricWithHistory,
  range: TimeRange,
  customStart: string,
  customEnd: string
): { currentValue: string; change: number; trend: "up" | "down" } {
  const { history, unit } = metric;
  if (history.length === 0) {
    return { currentValue: "--", change: 0, trend: "up" };
  }

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const todayStr = toDateStr(today);

  let currentSlice = history.slice(-30);
  let prevSlice = history.slice(-60, -30);

  if (range === "today") {
    currentSlice = history.filter(h => h.date === todayStr);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    prevSlice = history.filter(h => h.date === toDateStr(yesterday));
  } else if (range === "yesterday") {
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const ys = toDateStr(yesterday);
    currentSlice = history.filter(h => h.date === ys);
    const dayBefore = new Date(today); dayBefore.setDate(dayBefore.getDate() - 2);
    prevSlice = history.filter(h => h.date === toDateStr(dayBefore));
  } else if (range === "week") {
    currentSlice = history.slice(-7);
    prevSlice = history.slice(-14, -7);
  } else if (range === "month") {
    currentSlice = history.slice(-30);
    prevSlice = history.slice(-60, -30);
  } else if (range === "custom" && customStart && customEnd) {
    currentSlice = history.filter(h => h.date >= customStart && h.date <= customEnd);
    const cs = new Date(customStart);
    const ce = new Date(customEnd);
    const periodDays = Math.round((ce.getTime() - cs.getTime()) / 86400000) + 1;
    const prevStart = new Date(cs); prevStart.setDate(prevStart.getDate() - periodDays);
    const prevEnd = new Date(cs); prevEnd.setDate(prevEnd.getDate() - 1);
    prevSlice = history.filter(h => h.date >= toDateStr(prevStart) && h.date <= toDateStr(prevEnd));
  }

  if (currentSlice.length === 0) currentSlice = history.slice(-1);
  if (prevSlice.length === 0) {
    const curLen = currentSlice.length;
    prevSlice = history.slice(0, Math.max(1, history.length - curLen));
  }

  const cur = currentSlice.reduce((s, h) => s + h.value, 0) / currentSlice.length;
  const prv = prevSlice.reduce((s, h) => s + h.value, 0) / prevSlice.length;
  const change = prv !== 0 ? ((cur - prv) / Math.abs(prv)) * 100 : 0;

  const dec = unit === "%" ? 2 : 0;
  return {
    currentValue: formatValue(cur, unit, dec),
    change: Math.round(change * 10) / 10,
    trend: change >= 0 ? "up" : "down",
  };
}

// ── Apply dimension-based data variation ──
function applyDimension(
  history: { date: string; value: number }[],
  dimension: Dimension
): { date: string; value: number }[] {
  const multipliers: Record<Dimension, number> = { channel: 0.15, version: 0.12, segment: 0.20 };
  const rand = seededRandom(dimension.length * 3 + history.length);
  return history.map(h => ({
    date: h.date,
    value: Math.round(h.value * (1 + (rand() - 0.35) * multipliers[dimension]) * 100) / 100,
  }));
}

// ══════════════════════════════════════════════
//  Mini Sparkline (KPI card inline SVG)
// ══════════════════════════════════════════════
function MiniSparkline({ data, color }: { data: { value: number }[]; color: string }) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 130;
  const h = 38;

  const points = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d.value - min) / range) * h}`)
    .join(" ");

  const last = data[data.length - 1];
  const lx = w;
  const ly = h - ((last.value - min) / range) * h;

  return (
    <svg width={w} height={h} className="shrink-0">
      <defs>
        <linearGradient id={`ms-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#ms-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r={2.5} fill={color} />
    </svg>
  );
}

// ══════════════════════════════════════════════
//  Full Trend Chart (line / bar / area) for drawer
// ══════════════════════════════════════════════
function FullTrendChart({
  data, type, color, width, height,
}: {
  data: { date: string; value: number }[];
  type: ChartType;
  color: string;
  width: number;
  height: number;
}) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>暂无数据</div>;
  }
  if (data.length === 1) {
    const v = data[0].value;
    return <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>单日数据: {v}</div>;
  }

  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pad = { top: 16, right: 20, bottom: 32, left: 52 };
  const pw = width - pad.left - pad.right;
  const ph = height - pad.top - pad.bottom;
  const gradId = `ft-${color.replace("#", "")}`;

  // Y-axis ticks
  const yTicks = [min, (min + max) / 2, max];

  // Bar chart data
  const barWidth = Math.max(2, (pw / data.length) * 0.7);
  const bars = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * pw - barWidth / 2;
    const barH = ((d.value - min) / range) * ph;
    return { x, y: pad.top + ph - barH, w: barWidth, h: Math.max(1, barH) };
  });

  // Line/area points
  const linePoints = data
    .map((d, i) => {
      const x = pad.left + (i / (data.length - 1)) * pw;
      const y = pad.top + ph - ((d.value - min) / range) * ph;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {yTicks.map((_, i) => {
        const y = pad.top + (ph / 2) * i;
        return (
          <line
            key={`grid-${i}`}
            x1={pad.left} y1={y} x2={pad.left + pw} y2={y}
            stroke="currentColor" strokeOpacity={0.07} strokeWidth={1}
          />
        );
      })}

      {/* Y-axis labels */}
      {yTicks.map((v, i) => {
        const y = pad.top + (ph / 2) * i;
        const label = v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 100) / 100);
        return (
          <text key={`yl-${i}`} x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10 }}>
            {label}
          </text>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const skip = Math.max(1, Math.floor(data.length / 6));
        if (i % skip !== 0 && i !== data.length - 1 && i !== 0) return null;
        const x = pad.left + (i / (data.length - 1)) * pw;
        return (
          <text key={`xl-${i}`} x={x} y={pad.top + ph + 18} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>
            {d.date.slice(5)}
          </text>
        );
      })}

      {/* Bar rendering */}
      {type === "bar" &&
        bars.map((bar, i) => (
          <rect key={`b-${i}`} x={bar.x} y={bar.y} width={bar.w} height={bar.h} fill={color} opacity={0.65} rx={1.5} />
        ))}

      {/* Area + Line rendering */}
      {(type === "line" || type === "area") && (
        <>
          {type === "area" && (
            <polygon
              points={`${pad.left},${pad.top + ph} ${linePoints} ${pad.left + pw},${pad.top + ph}`}
              fill={`url(#${gradId})`}
            />
          )}
          <polyline
            points={linePoints}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data point dots */}
          {data.map((d, i) => {
            const x = pad.left + (i / (data.length - 1)) * pw;
            const y = pad.top + ph - ((d.value - min) / range) * ph;
            const skip = Math.max(1, Math.floor(data.length / 12));
            if (i % skip !== 0 && i !== data.length - 1 && i !== 0) return null;
            return <circle key={`dot-${i}`} cx={x} cy={y} r={2.5} fill={color} />;
          })}
        </>
      )}
    </svg>
  );
}

// ══════════════════════════════════════════════
//  KPI Card component
// ══════════════════════════════════════════════
function KpiCard({
  metric,
  onClick,
}: {
  metric: MetricWithHistory;
  onClick: () => void;
}) {
  const isUp = metric.trend === "up";
  const trendColor = isUp ? "#10B981" : "#EF4444";
  const sparklineData = metric.history.slice(-30);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left rounded-2xl border border-white/20 dark:border-gray-700/40
        bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl p-[18px] shadow-sm
        hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/80 dark:hover:bg-gray-900/80
        active:scale-[0.995] transition-all duration-200 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02] rounded-2xl pointer-events-none" />
      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {metric.label}
          </span>
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              isUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            }`}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {metric.change > 0 ? "+" : ""}{metric.change}%
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-[26px] font-bold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">
            {metric.currentValue}
          </span>
          {metric.unit && <span className="text-xs text-gray-400 dark:text-gray-500">{metric.unit}</span>}
        </div>

        {/* Benchmark */}
        <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
          基准 {metric.benchmark}
        </div>

        {/* Mini sparkline */}
        <div className="flex justify-end">
          <MiniSparkline data={sparklineData} color={trendColor} />
        </div>

        {/* Hover hint */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-full">
            点击详情
          </span>
        </div>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════
//  Metric Detail Drawer
// ══════════════════════════════════════════════
function MetricDrawer({
  open,
  onClose,
  metric,
  chartType,
  setChartType,
  dimension,
  setDimension,
}: {
  open: boolean;
  onClose: () => void;
  metric: MetricWithHistory | null;
  chartType: ChartType;
  setChartType: (t: ChartType) => void;
  dimension: Dimension;
  setDimension: (d: Dimension) => void;
}) {
  if (!metric) return null;

  const displayData = applyDimension(metric.history.slice(-30), dimension);
  const isUp = metric.trend === "up";
  const trendColor = isUp ? "#10B981" : "#EF4444";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full bg-white dark:bg-gray-900 shadow-2xl
          border-l border-gray-200/60 dark:border-gray-800 flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ width: "550px", maxWidth: "100vw" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{metric.label}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">最近 30 天趋势详情</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* KPI summary pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 p-3 text-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">当前值</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{metric.currentValue}</div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 p-3 text-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">环比变化</div>
              <div className={`text-lg font-bold tabular-nums ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                {metric.change > 0 ? "+" : ""}{metric.change}%
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 p-3 text-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">基准</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{metric.benchmark}</div>
            </div>
          </div>

          {/* Controls row: dimension + chart type */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Dimension selector */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {DIMENSION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDimension(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    dimension === opt.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Chart type toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {([
                { value: "line" as ChartType, icon: LineChart, label: "折线图" },
                { value: "bar" as ChartType, icon: BarChart3, label: "柱状图" },
                { value: "area" as ChartType, icon: AreaChart, label: "面积图" },
              ]).map(ct => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => setChartType(ct.value)}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    chartType === ct.value
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                  title={ct.label}
                >
                  <ct.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Chart container */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 overflow-x-auto">
            <FullTrendChart
              data={displayData}
              type={chartType}
              color={trendColor}
              width={Math.max(480, displayData.length * 18)}
              height={260}
            />
          </div>

          {/* Data table */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">数据明细（最近 15 天）</h4>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden max-h-52 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">日期</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">值</th>
                  </tr>
                </thead>
                <tbody>
                  {displayData.slice(-15).reverse().map((d, i) => (
                    <tr key={i} className="border-t border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{d.date}</td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100 font-medium tabular-nums">
                        {d.value >= 10000 ? `${(d.value / 10000).toFixed(2)}万` : d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : String(d.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════
//  Main Data Page
// ══════════════════════════════════════════════
export default function DataPage() {
  const [baseMetrics, setBaseMetrics] = useState<MetricWithHistory[]>([]);
  const [hasData, setHasData] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "anomaly" | "upload">("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMetric, setDrawerMetric] = useState<MetricWithHistory | null>(null);
  const [chartType, setChartType] = useState<ChartType>("line");
  const [dimension, setDimension] = useState<Dimension>("channel");

  // Initialize metrics from localStorage or mock data
  useEffect(() => {
    const uploaded = getUploadedMetrics();
    if (uploaded.length > 0) {
      setHasData(true);
      const merged = [...generateDefaultMockMetrics()];
      for (const s of uploaded) {
        const converted = storedToMetric(s);
        const idx = merged.findIndex(m => m.label === s.label);
        if (idx >= 0) {
          merged[idx] = converted;
        } else {
          merged.push(converted);
        }
      }
      setBaseMetrics(merged);
    } else {
      setBaseMetrics(generateDefaultMockMetrics());
    }
  }, []);

  // Compute display values driven by time range selection
  const metrics = useMemo(() => {
    return baseMetrics.map(m => {
      const display = computeDisplay(m, timeRange, customStart, customEnd);
      return { ...m, ...display };
    });
  }, [baseMetrics, timeRange, customStart, customEnd]);

  // ── Export CSV ──
  const handleExport = useCallback(() => {
    showToast("正在导出...", "info");

    const headers = ["指标", "日期", "值"];
    const rows: string[][] = [];
    for (const m of metrics) {
      for (const h of m.history) {
        rows.push([m.label, h.date, String(h.value)]);
      }
    }

    const csvContent = "﻿" + [
      headers.join(","),
      ...rows.map(r => r.map(c => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `KPI_Report_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => showToast("导出成功", "success"), 600);
  }, [metrics]);

  const tabs = [
    { key: "dashboard" as const, label: "指标看板", icon: BarChart3 },
    { key: "anomaly" as const, label: "异动归因", icon: AlertTriangle },
    { key: "upload" as const, label: "数据导入", icon: Upload },
  ];

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-emerald-200/60 dark:from-emerald-500/15 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">数据洞察</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">指标监控、异动归因、数据导入</p>
            </div>
          </div>

          {/* Export button — only visible on dashboard tab */}
          {activeTab === "dashboard" && (
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl mb-6 w-fit animate-fade-in">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Dashboard Tab ═══ */}
      {activeTab === "dashboard" && (
        <div className="animate-fade-in space-y-6">
          {/* Upload prompt banner — only when no real data uploaded */}
          {!hasData && (
            <div className="rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-8 text-center">
              <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">连接你的数据源</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
                上传 CSV 文件或接入数据库，Pulse 将自动生成指标看板、趋势图和异动归因分析。
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                前往上传数据
              </button>
            </div>
          )}

          {/* Has-data badge */}
          {hasData && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              已加载上传数据
            </div>
          )}
          {!hasData && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>
            </div>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-gray-400 mr-auto select-none">当前周期</span>
            <div className="flex items-center gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl">
              {TIME_RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    timeRange === opt.value
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range pickers */}
          {timeRange === "custom" && (
            <div className="flex items-center justify-end gap-2 animate-fade-in">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
                  dark:focus:border-emerald-500 transition-colors"
              />
              <span className="text-xs text-gray-400 select-none">至</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700
                  bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
                  dark:focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          {/* KPI Cards Grid — 3x2 desktop, 2x2 tablet, 2x1 mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map(metric => (
              <KpiCard
                key={metric.id}
                metric={metric}
                onClick={() => {
                  setDrawerMetric(metric);
                  setChartType("line");
                  setDimension("channel");
                  setDrawerOpen(true);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ═══ Anomaly Tab ═══ */}
      {activeTab === "anomaly" && <AnomalyAttribution />}

      {/* ═══ Upload Tab ═══ */}
      {activeTab === "upload" && <DataUpload />}

      {/* ═══ Metric Detail Drawer ═══ */}
      <MetricDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        metric={drawerMetric}
        chartType={chartType}
        setChartType={setChartType}
        dimension={dimension}
        setDimension={setDimension}
      />
    </div>
  );
}
