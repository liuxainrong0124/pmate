"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  StoredVersion,
  getMembers,
  addVersion,
  updateVersion,
  addLog,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

interface VersionFormProps {
  open: boolean;
  onClose: () => void;
  version: StoredVersion | null;
  onSaved: () => void;
}

export function VersionForm({ open, onClose, version, onSaved }: VersionFormProps) {
  const [form, setForm] = useState({
    version: "",
    name: "",
    description: "",
    plannedDate: "",
    assignee: "",
  });

  const members = getMembers();
  const isEdit = !!version;

  useEffect(() => {
    if (version) {
      setForm({
        version: version.version,
        name: version.name,
        description: version.description,
        plannedDate: version.plannedDate,
        assignee: version.assignee,
      });
    } else {
      setForm({ version: "", name: "", description: "", plannedDate: "", assignee: "" });
    }
  }, [version, open]);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.version.trim() || !form.name.trim()) return;

    if (isEdit && version) {
      updateVersion(version.id, {
        version: form.version.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        plannedDate: form.plannedDate,
        assignee: form.assignee,
      });
      addLog("编辑版本", form.version.trim(), `更新版本信息`);
      showToast("版本已更新", "success");
    } else {
      addVersion({
        version: form.version.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        plannedDate: form.plannedDate,
        assignee: form.assignee,
        status: "planning",
        requirementIds: [],
        releaseNote: "",
        retrospective: "",
      });
      addLog("新建版本", form.version.trim(), `创建版本 ${form.name.trim()}`);
      showToast("版本已创建", "success");
    }

    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑版本" : "新建版本"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                版本号 <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="如：v2.0.0"
                value={form.version}
                onChange={(e) => update("version", e.target.value)}
                className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                计划发布日期
              </label>
              <Input
                type="date"
                value={form.plannedDate}
                onChange={(e) => update("plannedDate", e.target.value)}
                className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
              版本名称 <span className="text-red-400">*</span>
            </label>
            <Input
              placeholder="如：用户中心重构"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">目标描述</label>
            <textarea
              placeholder="版本目标和关键特性..."
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">负责人</label>
            <select
              value={form.assignee}
              onChange={(e) => update("assignee", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
            >
              <option value="">选择负责人</option>
              {members
                .filter((m) => m.status === "active")
                .map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">取消</Button>
          <Button
            onClick={handleSave}
            disabled={!form.version.trim() || !form.name.trim()}
            className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
          >
            {isEdit ? "保存修改" : "创建版本"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
