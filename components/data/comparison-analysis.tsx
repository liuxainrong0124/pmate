"use client";

import { useState, useMemo } from "react";
import { MetricWithHistory } from "@/lib/mock/metrics-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const mx = xs.slice(-n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(-n).reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xd = xs[xs.length - n + i] - mx;
    const yd = ys[ys.length - n + i] - my;
    num += xd * yd;
    dx += xd * xd;
    dy += yd * yd;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

function DualLineChart({
  metricA, metricB, colorA, colorB, height, width,
}: {
  metricA: MetricWithHistory;
  metricB: MetricWithHistory;
  colorA: string;
  colorB: string;
  height: number;
  width: number;
}) {
  const dataA = metricA.history.slice(-30);
  const dataB = metricB.history.slice(-30);
  if (dataA.length < 2 || dataB.length < 2) {
    return <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>数据不足，无法绘制</div>;
  }

  const pad = { top: 16, right: 60, bottom: 40, left: 56 };
  const pw = width - pad.left - pad.right;
  const ph = height - pad.top - pad.bottom;

  const valsA = dataA.map(d => d.value), valsB = dataB.map(d => d.value);
  const minA = Math.min(...valsA), maxA = Math.max(...valsA);
  const minB = Math.min(...valsB), maxB = Math.max(...valsB);
  const rangeA = maxA - minA || 1;
  const rangeB = maxB - minB || 1;

  const dates = dataA.map(d => d.date);

  const lineA = dataA.map((d, i) => {
    const x = pad.left + (i / (dataA.length - 1)) * pw;
    const y = pad.top + ph - ((d.value - minA) / rangeA) * ph;
    return `${x},${y}`;
  }).join(" ");

  const lineB = dataB.map((d, i) => {
    const x = pad.left + (i / (dataB.length - 1)) * pw;
    const y = pad.top + ph - ((d.value - minB) / rangeB) * ph;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height}>
      {/* Grid lines */}
      {[0, 0.5, 1].map((frac, i) => {
        const y = pad.top + ph * frac;
        return (
          <line key={`g-${i}`} x1={pad.left} y1={y} x2={pad.left + pw} y2={y}
            stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
        );
      })}

      {/* Y-axis labels A (left) */}
      {[minA, (minA + maxA) / 2, maxA].map((v, i) => {
        const y = pad.top + (ph / 2) * i;
        const label = v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 100) / 100);
        return (
          <text key={`ya-${i}`} x={pad.left - 8} y={y + 4} textAnchor="end" fill={colorA} style={{ fontSize: 9, fontWeight: 500 }}>
            {label}
          </text>
        );
      })}

      {/* Y-axis labels B (right) */}
      {[minB, (minB + maxB) / 2, maxB].map((v, i) => {
        const y = pad.top + (ph / 2) * i;
        const label = v >= 10000 ? `${(v / 10000).toFixed(1)}万` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v * 100) / 100);
        return (
          <text key={`yb-${i}`} x={pad.left + pw + 8} y={y + 4} textAnchor="start" fill={colorB} style={{ fontSize: 9, fontWeight: 500 }}>
            {label}
          </text>
        );
      })}

      {/* X-axis labels */}
      {dates.map((d, i) => {
        const skip = Math.max(1, Math.floor(dates.length / 6));
        if (i % skip !== 0 && i !== 0 && i !== dates.length - 1) return null;
        const x = pad.left + (i / (dates.length - 1)) * pw;
        return (
          <text key={`x-${i}`} x={x} y={pad.top + ph + 22} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>
            {d.slice(5)}
          </text>
        );
      })}

      {/* Line A */}
      <polyline points={lineA} fill="none" stroke={colorA} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Line B */}
      <polyline points={lineB} fill="none" stroke={colorB} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />

      {/* Data dots A */}
      {dataA.map((d, i) => {
        const skip = Math.max(1, Math.floor(dataA.length / 10));
        if (i % skip !== 0 && i !== dataA.length - 1 && i !== 0) return null;
        const x = pad.left + (i / (dataA.length - 1)) * pw;
        const y = pad.top + ph - ((d.value - minA) / rangeA) * ph;
        return <circle key={`da-${i}`} cx={x} cy={y} r={2.5} fill={colorA} />;
      })}
      {dataB.map((d, i) => {
        const skip = Math.max(1, Math.floor(dataB.length / 10));
        if (i % skip !== 0 && i !== dataB.length - 1 && i !== 0) return null;
        const x = pad.left + (i / (dataB.length - 1)) * pw;
        const y = pad.top + ph - ((d.value - minB) / rangeB) * ph;
        return <circle key={`db-${i}`} cx={x} cy={y} r={2.5} fill={colorB} />;
      })}
    </svg>
  );
}

export function ComparisonAnalysis({ metrics }: { metrics: MetricWithHistory[] }) {
  const [metricAId, setMetricAId] = useState<string>(metrics[0]?.id || "");
  const [metricBId, setMetricBId] = useState<string>(metrics[1]?.id || "");

  const metricA = metrics.find(m => m.id === metricAId);
  const metricB = metrics.find(m => m.id === metricBId);

  const correlation = useMemo(() => {
    if (!metricA || !metricB) return null;
    return pearsonCorrelation(
      metricA.history.map(h => h.value),
      metricB.history.map(h => h.value),
    );
  }, [metricA, metricB]);

  const comparisonStats = useMemo(() => {
    if (!metricA || !metricB) return null;
    const aVals = metricA.history.slice(-30).map(h => h.value);
    const bVals = metricB.history.slice(-30).map(h => h.value);
    const aAvg = aVals.reduce((s, v) => s + v, 0) / aVals.length;
    const bAvg = bVals.reduce((s, v) => s + v, 0) / bVals.length;
    const diff = aAvg !== 0 ? ((bAvg - aAvg) / aAvg) * 100 : 0;

    const aVol = Math.sqrt(aVals.reduce((s, v) => s + Math.pow(v - aAvg, 2), 0) / aVals.length);
    const bVol = Math.sqrt(bVals.reduce((s, v) => s + Math.pow(v - bAvg, 2), 0) / bVals.length);

    return { aAvg, bAvg, diff, aVol, bVol };
  }, [metricA, metricB]);

  if (metrics.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center">
        <ArrowLeftRight className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">需要至少 2 个指标才能进行对比分析</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Selectors */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">指标对比分析</h3>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">指标 A</span>
            <Select value={metricAId} onValueChange={v => v && setMetricAId(v)}>
              <SelectTrigger className="w-[150px] rounded-xl border-gray-200">
                <SelectValue placeholder="选择指标" />
              </SelectTrigger>
              <SelectContent>
                {metrics.filter(m => m.id !== metricBId).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-gray-300" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">指标 B</span>
            <Select value={metricBId} onValueChange={v => v && setMetricBId(v)}>
              <SelectTrigger className="w-[150px] rounded-xl border-gray-200">
                <SelectValue placeholder="选择指标" />
              </SelectTrigger>
              <SelectContent>
                {metrics.filter(m => m.id !== metricAId).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {metricA && metricB && (
        <>
          {/* Comparison Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: "#6366F1" }} />
                <span className="text-xs font-medium text-gray-700">{metricA.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded-full border-t-2 border-dashed" style={{ borderColor: "#F59E0B" }} />
                <span className="text-xs font-medium text-gray-700">{metricB.label}</span>
              </div>
              <span className="ml-auto text-[10px] text-gray-400">最近 30 天趋势对比（实线=指标A，虚线=指标B，左右双Y轴）</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <DualLineChart
                metricA={metricA}
                metricB={metricB}
                colorA="#6366F1"
                colorB="#F59E0B"
                width={Math.max(560, 30 * 16)}
                height={280}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">相关性</span>
              <div className="mt-2">
                <span className={`text-xl font-bold ${
                  correlation !== null && Math.abs(correlation) > 0.7 ? "text-indigo-600" :
                  correlation !== null && Math.abs(correlation) > 0.4 ? "text-amber-600" : "text-gray-500"
                }`}>
                  {correlation !== null ? (correlation * 100).toFixed(0) + "%" : "—"}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {correlation !== null && correlation > 0.7 ? "强正相关" :
                   correlation !== null && correlation > 0.4 ? "中等正相关" :
                   correlation !== null && correlation > -0.4 ? "弱相关" :
                   correlation !== null && correlation > -0.7 ? "中等负相关" :
                   correlation !== null ? "强负相关" : ""}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{metricA.label} 均值</span>
              <div className="mt-2">
                <span className="text-xl font-bold text-gray-900 tabular-nums">
                  {comparisonStats ? (comparisonStats.aAvg >= 10000 ? `${(comparisonStats.aAvg / 10000).toFixed(1)}万` : comparisonStats.aAvg >= 1000 ? `${(comparisonStats.aAvg / 1000).toFixed(1)}k` : comparisonStats.aAvg.toFixed(1)) : "—"}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">波动率 {comparisonStats ? ((comparisonStats.aVol / comparisonStats.aAvg) * 100).toFixed(1) : "—"}%</p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{metricB.label} 均值</span>
              <div className="mt-2">
                <span className="text-xl font-bold text-gray-900 tabular-nums">
                  {comparisonStats ? (comparisonStats.bAvg >= 10000 ? `${(comparisonStats.bAvg / 10000).toFixed(1)}万` : comparisonStats.bAvg >= 1000 ? `${(comparisonStats.bAvg / 1000).toFixed(1)}k` : comparisonStats.bAvg.toFixed(1)) : "—"}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">波动率 {comparisonStats ? ((comparisonStats.bVol / comparisonStats.bAvg) * 100).toFixed(1) : "—"}%</p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">相对差异 (B vs A)</span>
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`text-xl font-bold tabular-nums ${
                  comparisonStats && comparisonStats.diff > 0 ? "text-emerald-600" :
                  comparisonStats && comparisonStats.diff < 0 ? "text-red-500" : "text-gray-500"
                }`}>
                  {comparisonStats ? (comparisonStats.diff > 0 ? "+" : "") + comparisonStats.diff.toFixed(1) + "%" : "—"}
                </span>
                {comparisonStats && (
                  comparisonStats.diff > 3 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                  comparisonStats.diff < -3 ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                  <Minus className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">数据明细（最近 15 天）</h4>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">日期</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">{metricA.label}</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">{metricB.label}</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">差异率</th>
                  </tr>
                </thead>
                <tbody>
                  {metricA.history.slice(-15).reverse().map((a, i) => {
                    const b = metricB.history.slice(-15).reverse()[i];
                    const diff = b && a.value !== 0 ? ((b.value - a.value) / Math.abs(a.value)) * 100 : null;
                    return (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-2 text-gray-600">{a.date}</td>
                        <td className="px-4 py-2 text-right text-gray-900 font-medium tabular-nums">
                          {a.value >= 10000 ? `${(a.value / 10000).toFixed(2)}万` : a.value >= 1000 ? `${(a.value / 1000).toFixed(1)}k` : String(Math.round(a.value * 100) / 100)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900 font-medium tabular-nums">
                          {b ? (b.value >= 10000 ? `${(b.value / 10000).toFixed(2)}万` : b.value >= 1000 ? `${(b.value / 1000).toFixed(1)}k` : String(Math.round(b.value * 100) / 100)) : "—"}
                        </td>
                        <td className={`px-4 py-2 text-right tabular-nums ${
                          diff !== null && diff > 0 ? "text-emerald-600" : diff !== null && diff < 0 ? "text-red-500" : "text-gray-400"
                        }`}>
                          {diff !== null ? (diff > 0 ? "+" : "") + diff.toFixed(1) + "%" : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
