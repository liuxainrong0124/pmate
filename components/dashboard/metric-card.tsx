"use client";

import { MetricData } from "@/lib/mock/dashboard-data";

interface MetricCardProps {
  metric: MetricData;
  delay?: number;
}

function Sparkline({ data, trend }: { data: number[]; trend: "up" | "down" }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const color = trend === "up" ? "#10B981" : "#EF4444";

  return (
    <svg width={w} height={h} className="shrink-0 opacity-60">
      <defs>
        <linearGradient id={`spark-${trend}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h - pad} ${points.join(" ")} ${w - pad},${h - pad}`}
        fill={`url(#spark-${trend})`}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MetricCard({ metric, delay = 0 }: MetricCardProps) {
  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/40 dark:hover:shadow-gray-950/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{metric.label}</span>
        <Sparkline data={metric.sparkline} trend={metric.trend} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-gray-900 dark:text-gray-100 tabular-nums tracking-tight">{metric.value}</span>
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${
            metric.trend === "up"
              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
              : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10"
          }`}
        >
          <span className="text-[10px]">{metric.trend === "up" ? "↑" : "↓"}</span>
          {Math.abs(metric.change)}%
        </span>
      </div>
    </div>
  );
}
