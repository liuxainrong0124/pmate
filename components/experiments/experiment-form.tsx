"use client";

import { useState, useEffect } from "react";
import { FlaskConical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addExperiment, updateExperiment, addLog, StoredExperiment } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

const goalMetricOptions = ["点击率", "转化率", "留存率", "打开率"];

interface ExperimentFormProps {
  open: boolean;
  experiment: StoredExperiment | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ExperimentForm({ open, experiment, onClose, onSaved }: ExperimentFormProps) {
  const isEdit = !!experiment;

  const [name, setName] = useState("");
  const [goalMetric, setGoalMetric] = useState("点击率");
  const [description, setDescription] = useState("");
  const [groupA, setGroupA] = useState("对照组");
  const [groupB, setGroupB] = useState("实验组");
  const [trafficSplit, setTrafficSplit] = useState(50);
  const [plannedDays, setPlannedDays] = useState(7);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (experiment) {
        setName(experiment.name);
        setGoalMetric(experiment.goalMetric);
        setDescription(experiment.description);
        setGroupA(experiment.groupA);
        setGroupB(experiment.groupB);
        setTrafficSplit(experiment.trafficSplit);
        setPlannedDays(experiment.plannedDays);
      } else {
        setName("");
        setGoalMetric("点击率");
        setDescription("");
        setGroupA("对照组");
        setGroupB("实验组");
        setTrafficSplit(50);
        setPlannedDays(7);
      }
      setErrors({});
    }
  }, [open, experiment]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "请输入实验名称";
    if (!groupA.trim()) errs.groupA = "请输入 A 组名称";
    if (!groupB.trim()) errs.groupB = "请输入 B 组名称";
    if (trafficSplit < 10 || trafficSplit > 90) errs.trafficSplit = "流量比例需在 10% ~ 90% 之间";
    if (plannedDays < 1 || plannedDays > 365) errs.plannedDays = "运行天数需在 1 ~ 365 天之间";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const base = {
      name: name.trim(),
      goalMetric,
      description: description.trim(),
      groupA: groupA.trim(),
      groupB: groupB.trim(),
      trafficSplit,
      plannedDays,
    };

    if (isEdit && experiment) {
      updateExperiment(experiment.id, base);
      showToast(`实验「${name.trim()}」已更新`, "success");
      addLog("edit_experiment", name.trim(), "编辑 A/B 实验信息");
    } else {
      addExperiment({ ...base, startDate: "" });
      showToast(`实验「${name.trim()}」已创建`, "success");
      addLog("create_experiment", name.trim(), "创建新的 A/B 实验");
    }

    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <DialogTitle>{isEdit ? "编辑实验" : "创建实验"}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit ? "修改 A/B 实验的配置信息" : "创建一个新的 A/B 测试实验"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Experiment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              实验名称 <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="例如：首页按钮颜色测试"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-red-300 dark:border-red-500/50" : ""}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Goal Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              目标指标 <span className="text-red-400">*</span>
            </label>
            <Select value={goalMetric} onValueChange={(v) => setGoalMetric(v || "")}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalMetricOptions.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              变量描述
            </label>
            <Textarea
              placeholder="描述你要测试的变量和假设..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Group Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                A 组名称（对照） <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="对照组"
                value={groupA}
                onChange={(e) => setGroupA(e.target.value)}
                className={errors.groupA ? "border-red-300 dark:border-red-500/50" : ""}
              />
              {errors.groupA && <p className="text-xs text-red-500 mt-1">{errors.groupA}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                B 组名称（实验） <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="实验组"
                value={groupB}
                onChange={(e) => setGroupB(e.target.value)}
                className={errors.groupB ? "border-red-300 dark:border-red-500/50" : ""}
              />
              {errors.groupB && <p className="text-xs text-red-500 mt-1">{errors.groupB}</p>}
            </div>
          </div>

          {/* Traffic Split Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              流量分配比例
            </label>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">A组 {trafficSplit}%</span>
              <input
                type="range"
                min={10}
                max={90}
                value={trafficSplit}
                onChange={(e) => setTrafficSplit(Number(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-teal-500 cursor-pointer"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-12">B组 {100 - trafficSplit}%</span>
            </div>
            {errors.trafficSplit && <p className="text-xs text-red-500">{errors.trafficSplit}</p>}
          </div>

          {/* Planned Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              预计运行天数 <span className="text-red-400">*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={365}
              value={plannedDays}
              onChange={(e) => setPlannedDays(Number(e.target.value))}
              className={errors.plannedDays ? "border-red-300 dark:border-red-500/50" : ""}
            />
            {errors.plannedDays && <p className="text-xs text-red-500 mt-1">{errors.plannedDays}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            取消
          </Button>
          <Button onClick={handleSave} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white">
            {isEdit ? "保存修改" : "创建实验"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
