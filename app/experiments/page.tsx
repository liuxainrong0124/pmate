"use client";

import { useState, useEffect, useCallback } from "react";
import { FlaskConical, Plus, Pencil, Trash2, Play, Square, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getExperiments,
  deleteExperiment,
  updateExperiment,
  addLog,
  StoredExperiment,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { ExperimentForm } from "@/components/experiments/experiment-form";
import { ExperimentDetail } from "@/components/experiments/experiment-detail";
import { ExperimentResult } from "@/components/experiments/experiment-result";

type StatusFilter = "all" | "draft" | "running" | "ended";

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  running: { label: "运行中", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  ended: { label: "已结束", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<StoredExperiment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<StoredExperiment | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<StoredExperiment | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [resultExperiment, setResultExperiment] = useState<StoredExperiment | null>(null);

  const loadExperiments = useCallback(() => {
    setExperiments(getExperiments());
  }, []);

  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);

  const filtered =
    statusFilter === "all"
      ? experiments
      : experiments.filter((e) => e.status === statusFilter);

  const handleCreate = () => {
    setEditingExperiment(null);
    setShowForm(true);
  };

  const handleEdit = (exp: StoredExperiment) => {
    if (exp.status !== "draft") {
      showToast("仅草稿状态的实验可以编辑", "info");
      return;
    }
    setEditingExperiment(exp);
    setShowForm(true);
  };

  const handleStart = (exp: StoredExperiment) => {
    if (exp.status !== "draft") return;
    updateExperiment(exp.id, {
      status: "running",
      startDate: new Date().toISOString().slice(0, 10),
      sampleA: 0,
      sampleB: 0,
      valueA: 0,
      valueB: 0,
    });
    showToast(`实验「${exp.name}」已启动`, "success");
    addLog("start_experiment", exp.name, "启动 A/B 实验");
    loadExperiments();
  };

  const handleEnd = (exp: StoredExperiment) => {
    if (exp.status !== "running") return;
    const sampleA = Math.floor(Math.random() * 3000) + 2000;
    const sampleB = Math.floor(Math.random() * 3000) + 2000;
    const baseValueA = exp.goalMetric === "点击率" ? 0.12 : exp.goalMetric === "留存率" ? 0.45 : exp.goalMetric === "打开率" ? 0.22 : 0.08;
    const baseValueB = baseValueA * (1 + (Math.random() * 0.2 + 0.05));
    const lift = ((baseValueB - baseValueA) / baseValueA) * 100;
    const confidence = lift > 10 ? 0.95 : 0.80;
    const conclusion = lift > 10 ? "提升显著，建议采用 B 组方案" : "提升不显著，建议增加样本量继续测试";

    updateExperiment(exp.id, {
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
    showToast(`实验「${exp.name}」已结束`, "success");
    addLog("end_experiment", exp.name, `提升率 ${Math.round(lift * 10) / 10}%，置信度 ${Math.round(confidence * 100)}%`);
    loadExperiments();
  };

  const handleDelete = (exp: StoredExperiment) => {
    if (!window.confirm(`确定删除实验「${exp.name}」吗？此操作不可撤销。`)) return;
    deleteExperiment(exp.id);
    showToast(`实验「${exp.name}」已删除`, "success");
    addLog("delete_experiment", exp.name, "删除 A/B 实验");
    loadExperiments();
  };

  const handleOpenDetail = (exp: StoredExperiment) => {
    setSelectedExperiment({ ...exp });
    setShowDetail(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingExperiment(null);
  };

  const handleFormSaved = () => {
    loadExperiments();
    handleCloseForm();
  };

  const handleExperimentUpdated = (updated: StoredExperiment) => {
    setSelectedExperiment(updated);
    loadExperiments();
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "draft", label: "草稿" },
    { key: "running", label: "运行中" },
    { key: "ended", label: "已结束" },
  ];

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-cyan-200/60 dark:from-cyan-500/15 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-cyan-600 dark:text-cyan-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">A/B 实验</h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">创建和管理 A/B 测试，驱动数据决策</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            创建实验
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl mb-6 w-fit animate-fade-in">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              statusFilter === f.key
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Experiment Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-500/5 p-12 text-center animate-fade-in">
          <FlaskConical className="w-12 h-12 text-cyan-400 dark:text-cyan-500/40 mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">还没有实验</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            A/B 实验帮助你用数据验证假设，科学决策产品迭代方向
          </p>
          <Button onClick={handleCreate} className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm">
            <Plus className="w-4 h-4" />
            创建第一个实验
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
              onClick={() => handleOpenDetail(exp)}
            >
              {/* Card Header */}
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 flex-1 mr-2">
                    {exp.name}
                  </h3>
                  <Badge className={`shrink-0 ${statusBadge[exp.status]?.className || ""}`}>
                    {statusBadge[exp.status]?.label || exp.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {exp.goalMetric}
                  </span>
                </div>
                {/* A/B group brief */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">A组 (对照)</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{exp.groupA}</div>
                    {exp.status !== "draft" && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        样本: {(exp.sampleA || 0).toLocaleString()} / 指标: {((exp.valueA || 0) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">B组 (实验)</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{exp.groupB}</div>
                    {exp.status !== "draft" && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        样本: {(exp.sampleB || 0).toLocaleString()} / 指标: {((exp.valueB || 0) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
                {/* Dates & Traffic Split */}
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>
                    {exp.startDate || "未开始"} {exp.endDate ? ` — ${exp.endDate}` : ` · ${exp.plannedDays} 天`}
                  </span>
                  <span>流量 {exp.trafficSplit}/{100 - exp.trafficSplit}</span>
                </div>
              </div>

              {/* Card Footer / Actions */}
              <div className="px-4 pb-3 pt-1 border-t border-gray-50 dark:border-gray-800/50 flex items-center gap-1 flex-wrap">
                {exp.status === "draft" && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      编辑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStart(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      开始
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
                {exp.status === "running" && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEnd(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <Square className="w-3 h-3" />
                      结束
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
                {exp.status === "ended" && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setResultExperiment(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      查看报告
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(exp); }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <ExperimentForm
        open={showForm}
        experiment={editingExperiment}
        onClose={handleCloseForm}
        onSaved={handleFormSaved}
      />

      {/* Detail Drawer */}
      {selectedExperiment && (
        <ExperimentDetail
          experiment={selectedExperiment}
          open={showDetail}
          onClose={() => { setShowDetail(false); loadExperiments(); }}
          onUpdated={handleExperimentUpdated}
        />
      )}

      {/* Result Dialog */}
      {resultExperiment && (
        <ExperimentResult
          experiment={resultExperiment}
          open={!!resultExperiment}
          onClose={() => setResultExperiment(null)}
        />
      )}
    </div>
  );
}
