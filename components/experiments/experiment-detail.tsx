"use client";

import { useState, useEffect, useRef } from "react";
import { X, Square, TrendingUp, TrendingDown, Users, Target, Calendar, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateExperiment, addLog, StoredExperiment } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  running: { label: "运行中", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  ended: { label: "已结束", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
};

interface ExperimentDetailProps {
  experiment: StoredExperiment;
  open: boolean;
  onClose: () => void;
  onUpdated: (exp: StoredExperiment) => void;
}

export function ExperimentDetail({ experiment, open, onClose, onUpdated }: ExperimentDetailProps) {
  const [local, setLocal] = useState<StoredExperiment>(experiment);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLocal(experiment);
  }, [experiment]);

  // Simulate data growth for running experiments
  useEffect(() => {
    if (!open || local.status !== "running") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setLocal((prev) => {
        const addedA = Math.floor(Math.random() * 50) + 30;
        const addedB = Math.floor(Math.random() * 50) + 30;
        const sampleA = prev.sampleA + addedA;
        const sampleB = prev.sampleB + addedB;

        const baseValueA = prev.goalMetric === "点击率" ? 0.12 : prev.goalMetric === "留存率" ? 0.45 : prev.goalMetric === "打开率" ? 0.22 : 0.08;
        const noiseA = (Math.random() - 0.5) * 0.01;
        const noiseB = (Math.random() - 0.5) * 0.01 + 0.003;
        const valueA = Math.max(0.01, baseValueA + noiseA);
        const valueB = Math.max(0.01, baseValueA * 1.15 + noiseB);

        const updated = {
          ...prev,
          sampleA,
          sampleB,
          valueA: Math.round(valueA * 10000) / 10000,
          valueB: Math.round(valueB * 10000) / 10000,
        };

        onUpdated(updated);
        return updated;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [open, local.status]);

  const handleConfirmEnd = () => {
    const sampleA = Math.floor(Math.random() * 3000) + 2000;
    const sampleB = Math.floor(Math.random() * 3000) + 2000;
    const baseValueA = local.goalMetric === "点击率" ? 0.12 : local.goalMetric === "留存率" ? 0.45 : local.goalMetric === "打开率" ? 0.22 : 0.08;
    const baseValueB = baseValueA * (1 + (Math.random() * 0.2 + 0.05));
    const lift = ((baseValueB - baseValueA) / baseValueA) * 100;
    const confidence = lift > 10 ? 0.95 : 0.80;
    const conclusion = lift > 10 ? "提升显著，建议采用 B 组方案" : "提升不显著，建议增加样本量继续测试";

    updateExperiment(local.id, {
      status: "ended",
      endDate: new Date().toISOString().slice(0, 10),
      sampleA,
      sampleB,
      valueA: Math.round(baseValueA * 10000) / 10000,
      valueB: Math.round(baseValueB * 10000) / 10000,
      lift: Math.round(lift * 10) / 10,
      confidence,
      conclusion,
    });
    showToast(`实验「${local.name}」已结束`, "success");
    addLog("end_experiment", local.name, `提升率 ${Math.round(lift * 10) / 10}%，置信度 ${Math.round(confidence * 100)}%`);
    onClose();
  };

  const liftStr = local.lift > 0 ? `+${local.lift}%` : `${local.lift}%`;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/10 z-40 transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[500px] max-w-[100vw] bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl z-10 px-6 py-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Badge className={statusBadge[local.status]?.className || ""}>
                {statusBadge[local.status]?.label || local.status}
              </Badge>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg line-clamp-1">{local.name}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                <Target className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wide font-medium">目标指标</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{local.goalMetric}</span>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wide font-medium">流量分配</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                A {local.trafficSplit}% / B {100 - local.trafficSplit}%
              </span>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wide font-medium">时间</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {local.startDate || "未开始"} ~ {local.endDate || `预计 ${local.plannedDays} 天`}
              </span>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3.5">
              <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wide font-medium">创建日期</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{local.createdAt}</span>
            </div>
          </div>

          {/* Description */}
          {local.description && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">变量描述</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{local.description}</p>
            </div>
          )}

          {/* Group Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <h4 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{local.groupA}</h4>
              {local.status !== "draft" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">样本量</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {(local.sampleA || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">指标值</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {((local.valueA || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">实验未开始</p>
              )}
            </div>
            <div className="rounded-2xl border border-teal-100 dark:border-teal-500/20 bg-teal-50/30 dark:bg-teal-500/5 p-4">
              <h4 className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-3">{local.groupB}</h4>
              {local.status !== "draft" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">样本量</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                      {(local.sampleB || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">指标值</span>
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                      {((local.valueB || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  {local.status === "running" && local.valueB > 0 && local.valueA > 0 && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-teal-100 dark:border-teal-500/20">
                      <span className="text-xs text-gray-400 dark:text-gray-500">实时提升</span>
                      <span className={`text-xs font-semibold inline-flex items-center gap-0.5 ${
                        local.valueB > local.valueA ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                      }`}>
                        {local.valueB > local.valueA ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {((local.valueB - local.valueA) / Math.max(local.valueA, 0.0001) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">实验未开始</p>
              )}
            </div>
          </div>

          {/* Running: live indicator */}
          {local.status === "running" && (
            <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 p-3.5 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">实验正在运行中</p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/60">数据每 2 秒自动更新 · 样本量持续增长</p>
              </div>
            </div>
          )}

          {/* End Experiment Button */}
          {local.status === "running" && (
            <div>
              {!confirmingEnd ? (
                <Button
                  onClick={() => setConfirmingEnd(true)}
                  className="w-full rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                >
                  <Square className="w-4 h-4" />
                  结束实验
                </Button>
              ) : (
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">确定结束此实验吗？</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/60">
                    结束后将计算最终指标和提升率，实验状态将变更为&ldquo;已结束&rdquo;。
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmingEnd(false)}
                      className="rounded-xl text-xs flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleConfirmEnd}
                      className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs flex-1"
                    >
                      确认结束
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ended: Conclusion */}
          {local.status === "ended" && (
            <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                实验结论
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{liftStr}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">提升率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{Math.round(local.confidence * 100)}%</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">置信度</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    <Users className="w-5 h-5 inline" />
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">样本{(local.sampleA + local.sampleB).toLocaleString()}</div>
                </div>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{local.conclusion}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
