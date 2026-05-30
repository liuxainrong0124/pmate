"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/shared/toast";
import {
  addActivity,
  updateActivity,
  getActivityTemplates,
  addLog,
  StoredActivity,
  StoredActivityTemplate,
} from "@/lib/store/local-store";
import { FileText, ChevronDown } from "lucide-react";

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  activity?: StoredActivity;
  prefillDate?: string;
}

const channelOptions = [
  { value: "Push", label: "Push 推送" },
  { value: "短信", label: "短信" },
  { value: "站内信", label: "站内信" },
  { value: "邮件", label: "邮件" },
];

export function ActivityForm({
  open,
  onClose,
  onSave,
  activity,
  prefillDate,
}: ActivityFormProps) {
  const isEdit = !!activity;

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [channels, setChannels] = useState<string[]>([]);
  const [content, setContent] = useState("");

  const [templates, setTemplates] = useState<StoredActivityTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (activity) {
        setName(activity.name);
        setStartDate(activity.startDate);
        setEndDate(activity.endDate);
        setTargetAudience(activity.targetAudience);
        setChannels([...activity.channels]);
        setContent(activity.content);
      } else {
        setName("");
        setStartDate(prefillDate || new Date().toISOString().slice(0, 10));
        setEndDate(prefillDate || new Date().toISOString().slice(0, 10));
        setTargetAudience("");
        setChannels([]);
        setContent("");

        // Check for template prefill
        const tplId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("activity_prefill_template")
            : null;
        if (tplId) {
          sessionStorage.removeItem("activity_prefill_template");
          const tpls = getActivityTemplates();
          const tpl = tpls.find((t) => t.id === tplId);
          if (tpl) {
            setTargetAudience(tpl.targetAudience);
            setChannels([...tpl.channels]);
            setContent(tpl.content);
          }
        }
      }
      setTemplates(getActivityTemplates());
      setShowTemplateDropdown(false);
    }
  }, [open, activity, prefillDate]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowTemplateDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const applyTemplate = (tpl: StoredActivityTemplate) => {
    setTargetAudience(tpl.targetAudience);
    setChannels([...tpl.channels]);
    setContent(tpl.content);
    setShowTemplateDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("请输入活动名称", "error");
      return;
    }
    if (!startDate) {
      showToast("请选择开始日期", "error");
      return;
    }
    if (!endDate) {
      showToast("请选择结束日期", "error");
      return;
    }
    if (startDate > endDate) {
      showToast("结束日期不能早于开始日期", "error");
      return;
    }

    if (isEdit && activity) {
      updateActivity(activity.id, {
        name: name.trim(),
        startDate,
        endDate,
        targetAudience: targetAudience.trim(),
        channels,
        content: content.trim(),
      });
      addLog(
        "编辑",
        `活动 ${name.trim()}`,
        `更新活动信息：${startDate} ~ ${endDate}`
      );
      showToast("活动已更新", "success");
    } else {
      addActivity({
        name: name.trim(),
        startDate,
        endDate,
        targetAudience: targetAudience.trim(),
        channels,
        content: content.trim(),
      });
      addLog(
        "创建",
        `活动 ${name.trim()}`,
        `新建活动：${startDate} ~ ${endDate}`
      );
      showToast("活动已创建", "success");
    }
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑活动" : "新建活动"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改活动信息" : "创建一个新的运营活动"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              活动名称
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：618 大促推送"
              required
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                开始日期
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                结束日期
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Target audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              目标人群
            </label>
            <Textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="例如：近30天活跃用户、注册7天内新用户"
              rows={2}
            />
          </div>

          {/* Channels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              推送渠道
            </label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((ch) => {
                const active = channels.includes(ch.value);
                return (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => toggleChannel(ch.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                      active
                        ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                文案内容
              </label>
              {templates.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  >
                    <FileText className="w-3 h-3" />
                    使用模板
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  </Button>
                  {showTemplateDropdown && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 py-1 max-h-48 overflow-y-auto">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {tpl.name}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {tpl.content.slice(0, 40)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="活动文案内容..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">{isEdit ? "保存修改" : "创建活动"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
