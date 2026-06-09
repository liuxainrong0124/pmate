"use client";

import { useMemo, useState } from "react";
import { MetricWithHistory } from "@/lib/mock/metrics-data";
import { predictAllMetrics, PredictionResult } from "@/lib/prediction";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

export function PredictionView({ metrics }: { metrics: MetricWithHistory[] }) {
  const [forecastDays, setForecastDays] = useState<number>(7);

  const predictions = useMemo(() => {
    return predictAllMetrics(
      metrics.map((m) => ({ label: m.label, values: m.history.map((h) => h.value) })),
      forecastDays
    );
  }, [metrics, forecastDays]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">趋势预测</h3>
          <p className="text-xs text-gray-400 mt-0.5">基于线性回归的 {forecastDays} 天预测</p>
        </div>
        <select
          value={forecastDays}
          onChange={(e) => setForecastDays(Number(e.target.value))}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value={3}>3 天</option>
          <option value={7}>7 天</option>
          <option value={14}>14 天</option>
          <option value={30}>30 天</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {predictions.map((p) => (
          <PredictionCard key={p.label} prediction={p} />
        ))}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
        基于最近 {metrics[0]?.history.length || 0} 天历史数据 · 线性回归模型 · 仅供参考
      </div>
    </div>
  );
}

function PredictionCard({ prediction: p }: { prediction: PredictionResult }) {
  const confidenceColor =
    p.confidence >= 70 ? "text-emerald-600 dark:text-emerald-400" : p.confidence >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400";

  const TrendIcon = p.trend === "up" ? TrendingUp : p.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    p.trend === "up" ? "text-emerald-500" : p.trend === "down" ? "text-red-500" : "text-gray-400";

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{p.label}</span>
        <span className={`text-[10px] font-medium ${confidenceColor}`}>置信度 {p.confidence}%</span>
      </div>

      <div className="flex items-end gap-3 mb-3">
        <div>
          <span className="text-[10px] text-gray-400 block mb-0.5">当前</span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {p.currentValue >= 10000 ? `${(p.currentValue / 10000).toFixed(1)}万` : p.currentValue >= 1000 ? `${(p.currentValue / 1000).toFixed(1)}k` : String(Math.round(p.currentValue * 100) / 100)}
          </span>
        </div>
        <TrendIcon className={`w-4 h-4 mb-1 ${trendColor}`} />
        <div>
          <span className="text-[10px] text-gray-400 block mb-0.5">{p.forecastDays}天后预测</span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {p.predictedValue >= 10000 ? `${(p.predictedValue / 10000).toFixed(1)}万` : p.predictedValue >= 1000 ? `${(p.predictedValue / 1000).toFixed(1)}k` : String(Math.round(p.predictedValue * 100) / 100)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${trendColor}`}>
          {p.change > 0 ? "+" : ""}{p.change}%
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              p.trend === "up" ? "bg-emerald-500" : p.trend === "down" ? "bg-red-500" : "bg-gray-400"
            }`}
            style={{ width: `${Math.min(100, Math.abs(p.change) * 5)}%` }}
          />
        </div>
      </div>

      {p.rmse > 0 && (
        <p className="text-[10px] text-gray-400 mt-2">
          RMSE: {p.rmse}
        </p>
      )}
    </div>
  );
}
