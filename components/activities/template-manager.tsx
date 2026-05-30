"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/shared/toast";
import {
  getActivityTemplates,
  addActivityTemplate,
  deleteActivityTemplate,
  addLog,
  StoredActivityTemplate,
} from "@/lib/store/local-store";
import { ChevronDown, ChevronRight, Plus, FileText, Trash2, Pencil, Copy } from "lucide-react";

interface TemplateManagerProps {
  onUseTemplate?: (tpl: StoredActivityTemplate) => void;
}

const channelOptions = [
  { value: "Push", label: "Push" },
  { value: "短信", label: "短信" },
  { value: "站内信", label: "站内信" },
  { value: "邮件", label: "邮件" },
];

export function TemplateManager({ onUseTemplate }: TemplateManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [templates, setTemplates] = useState<StoredActivityTemplate[]>(() =>
    getActivityTemplates()
  );
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form fields
  const [tplName, setTplName] = useState("");
  const [tplAudience, setTplAudience] = useState("");
  const [tplChannels, setTplChannels] = useState<string[]>([]);
  const [tplContent, setTplContent] = useState("");

  const refreshTemplates = () => setTemplates(getActivityTemplates());

  const resetForm = () => {
    setTplName("");
    setTplAudience("");
    setTplChannels([]);
    setTplContent("");
    setShowForm(false);
    setEditId(null);
  };

  const toggleChannel = (ch: string) => {
    setTplChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSaveTemplate = () => {
    if (!tplName.trim()) {
      showToast("请输入模板名称", "error");
      return;
    }
    addActivityTemplate({
      name: tplName.trim(),
      targetAudience: tplAudience.trim(),
      channels: tplChannels,
      content: tplContent.trim(),
    });
    addLog("创建", `模板 ${tplName.trim()}`, "新建活动模板");
    showToast("模板已保存", "success");
    refreshTemplates();
    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    deleteActivityTemplate(id);
    addLog("删除", `模板 ${name}`, "删除活动模板");
    showToast("模板已删除", "success");
    refreshTemplates();
  };

  const handleUse = (tpl: StoredActivityTemplate) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("activity_prefill_template", tpl.id);
    }
    showToast("模板已加载到表单", "info");
    onUseTemplate?.(tpl);
  };

  const handleEdit = (tpl: StoredActivityTemplate) => {
    setEditId(tpl.id);
    setTplName(tpl.name);
    setTplAudience(tpl.targetAudience);
    setTplChannels([...tpl.channels]);
    setTplContent(tpl.content);
    setShowForm(true);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-500" />
          模板管理
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({templates.length})
          </span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-800">
          {/* Template list */}
          {templates.length === 0 && !showForm ? (
            <div className="py-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                还没有模板，创建一个快速复用
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                新建模板
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {tpl.name}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      目标：{tpl.targetAudience || "-"}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tpl.channels.map((ch) => (
                        <span
                          key={ch}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-[300px]">
                      {tpl.content.slice(0, 60)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      title="使用模板"
                      onClick={() => handleUse(tpl)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      title="编辑"
                      onClick={() => handleEdit(tpl)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      title="删除"
                      onClick={() => handleDelete(tpl.id, tpl.name)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {!showForm && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  新建模板
                </Button>
              )}
            </div>
          )}

          {/* Template form */}
          {showForm && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {editId ? "编辑模板" : "新建模板"}
              </h4>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  模板名称
                </label>
                <Input
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="例如：节日促销模板"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  目标人群
                </label>
                <Input
                  value={tplAudience}
                  onChange={(e) => setTplAudience(e.target.value)}
                  placeholder="例如：近30天活跃用户"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  推送渠道
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {channelOptions.map((ch) => {
                    const active = tplChannels.includes(ch.value);
                    return (
                      <button
                        key={ch.value}
                        type="button"
                        onClick={() => toggleChannel(ch.value)}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                          active
                            ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400"
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  文案内容
                </label>
                <Textarea
                  value={tplContent}
                  onChange={(e) => setTplContent(e.target.value)}
                  placeholder="模板文案..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={resetForm}>
                  取消
                </Button>
                <Button size="sm" onClick={handleSaveTemplate}>
                  {editId ? "保存" : "创建模板"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
