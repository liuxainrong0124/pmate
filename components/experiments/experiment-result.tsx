"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StoredExperiment, addLog } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { TrendingUp, TrendingDown, FileDown, Target, Users, ShieldCheck } from "lucide-react";

interface ExperimentResultProps {
  experiment: StoredExperiment;
  open: boolean;
  onClose: () => void;
}

export function ExperimentResult({ experiment, open, onClose }: ExperimentResultProps) {
  const { groupA, groupB, sampleA, sampleB, valueA, valueB, lift, confidence, conclusion, goalMetric } = experiment;

  const liftStr = lift > 0 ? `+${lift}%` : `${lift}%`;
  const metricLabel = goalMetric;
  const valueAStr = `${(valueA * 100).toFixed(1)}%`;
  const valueBStr = `${(valueB * 100).toFixed(1)}%`;
  const isSignificant = lift > 10;

  const exportToFile = () => {
    const lines = [
      `=================================`,
      `  A/B 实验结果报告`,
      `=================================`,
      ``,
      `实验名称: ${experiment.name}`,
      `目标指标: ${experiment.goalMetric}`,
      `实验周期: ${experiment.startDate} ~ ${experiment.endDate || "N/A"}`,
      ``,
      `--- A 组（对照）: ${groupA} ---`,
      `  样本量: ${sampleA.toLocaleString()}`,
      `  指标值(${metricLabel}): ${valueAStr}`,
      ``,
      `--- B 组（实验）: ${groupB} ---`,
      `  样本量: ${sampleB.toLocaleString()}`,
      `  指标值(${metricLabel}): ${valueBStr}`,
      ``,
      `--- 结果 ---`,
      `  提升率: ${liftStr}`,
      `  置信度: ${Math.round(confidence * 100)}%`,
      `  结论: ${conclusion}`,
      ``,
      `=================================`,
      `  生成时间: ${new Date().toLocaleString()}`,
      `=================================`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${experiment.name.replace(/[^a-zA-Z0-9一-龥]/g, "_")}_结果报告.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("报告已导出", "success");
    addLog("export_experiment", experiment.name, "导出 A/B 实验结果报告");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle>实验结果</DialogTitle>
          </div>
          <DialogDescription>{experiment.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* A vs B comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Group A */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 text-center">
              <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">{groupA}</div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500 mb-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px]">样本量</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {sampleA.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 dark:text-gray-500 text-[10px] mb-0.5">
                    {metricLabel}
                  </div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {valueAStr}
                  </div>
                </div>
              </div>
            </div>

            {/* Group B */}
            <div className="rounded-xl border border-teal-100 dark:border-teal-500/20 bg-teal-50/30 dark:bg-teal-500/5 p-4 text-center">
              <div className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">{groupB}</div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-center gap-1 text-gray-400 dark:text-gray-500 mb-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px]">样本量</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                    {sampleB.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-teal-600 dark:text-teal-400 text-[10px] mb-0.5">
                    {metricLabel}
                  </div>
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                    {valueBStr}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lift & Confidence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 text-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">提升率</div>
              <div className={`text-xl font-bold inline-flex items-center gap-1 ${
                lift > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
              }`}>
                {lift > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {liftStr}
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3.5 text-center">
              <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-0.5" />
                置信度
              </div>
              <div className={`text-xl font-bold ${
                confidence >= 0.95 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {Math.round(confidence * 100)}%
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div className={`rounded-xl border p-4 ${
            isSignificant
              ? "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5"
              : "border-amber-100 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5"
          }`}>
            <p className={`text-sm font-medium ${
              isSignificant ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
            }`}>
              {conclusion || (isSignificant ? "提升显著，建议采用 B 组方案" : "提升不显著，建议增加样本量继续测试")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            关闭
          </Button>
          <Button
            onClick={exportToFile}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white"
          >
            <FileDown className="w-4 h-4" />
            导出报告
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
