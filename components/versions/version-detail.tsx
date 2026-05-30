"use client";

import { useState, useEffect } from "react";
import { X, Pencil, Check, Plus, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  StoredVersion,
  PoolRequirement,
  getPoolRequirements,
  updateVersion,
  addLog,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

interface VersionDetailProps {
  version: StoredVersion | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const statusMeta: Record<string, { label: string; color: string }> = {
  planning: { label: "规划中", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "开发中", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  review: { label: "评审中", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  done: { label: "已上线", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  backlog: { label: "待排期", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export function VersionDetail({ version, open, onClose, onUpdated }: VersionDetailProps) {
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addReqOpen, setAddReqOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const allReqs = getPoolRequirements();
  const versionReqs = version
    ? allReqs.filter((r) => version.requirementIds?.includes(r.id))
    : [];
  const availableReqs = version
    ? allReqs.filter((r) => !version.requirementIds?.includes(r.id))
    : [];
  const isLocked = version?.status === "released";

  const reqProgress = (req: PoolRequirement) => {
    const map: Record<string, number> = {
      planning: 10, in_progress: 40, review: 70, done: 100, backlog: 0,
    };
    return map[req.status] || 0;
  };

  const startEdit = (field: string, currentValue: string) => {
    if (isLocked) return;
    setEditField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (!version || !editField) return;
    const updates: Partial<StoredVersion> = { [editField]: editValue };
    updateVersion(version.id, updates);
    addLog("编辑版本", version.version, `更新${editField}字段`);
    showToast("已更新", "success");
    setEditField(null);
    onUpdated();
  };

  const handleAddReqs = (reqIds: string[]) => {
    if (!version) return;
    const updated = [...(version.requirementIds || []), ...reqIds];
    updateVersion(version.id, { requirementIds: updated });
    addLog("关联需求", version.version, `关联了 ${reqIds.length} 个需求`);
    showToast(`已关联 ${reqIds.length} 个需求`, "success");
    setAddReqOpen(false);
    onUpdated();
  };

  const handleRemoveReq = (reqId: string) => {
    if (!version) return;
    const updated = (version.requirementIds || []).filter((id) => id !== reqId);
    updateVersion(version.id, { requirementIds: updated });
    addLog("移除需求", version.version, `移除了需求 ${reqId}`);
    showToast("已移除需求", "success");
    setRemoveConfirm(null);
    onUpdated();
  };

  if (!version) return null;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 transition-opacity" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[500px] z-50 bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{version.name}</h2>
              <span className="text-xs font-mono text-gray-400">{version.version}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Version Info Card */}
            <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">版本信息</h3>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />已锁定
                  </span>
                )}
              </div>

              {/* Version Number */}
              <EditableRow
                label="版本号"
                value={editField === "version" ? editValue : version.version}
                isEditing={editField === "version"}
                disabled={isLocked}
                onEdit={() => startEdit("version", version.version)}
                onSave={saveEdit}
                onChange={setEditValue}
                onCancel={() => setEditField(null)}
              />

              {/* Name */}
              <EditableRow
                label="版本名称"
                value={editField === "name" ? editValue : version.name}
                isEditing={editField === "name"}
                disabled={isLocked}
                onEdit={() => startEdit("name", version.name)}
                onSave={saveEdit}
                onChange={setEditValue}
                onCancel={() => setEditField(null)}
              />

              {/* Description */}
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">目标描述</span>
                {editField === "description" ? (
                  <div className="flex items-start gap-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-1 pt-0.5">
                      <button onClick={saveEdit} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditField(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 group">
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{version.description || "—"}</p>
                    {!isLocked && (
                      <button onClick={() => startEdit("description", version.description)} className="p-1 rounded-lg text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all"><Pencil className="w-3 h-3" /></button>
                    )}
                  </div>
                )}
              </div>

              {/* Planned Date */}
              <EditableRow
                label="计划日期"
                value={editField === "plannedDate" ? editValue : version.plannedDate || "—"}
                isEditing={editField === "plannedDate"}
                disabled={isLocked}
                onEdit={() => startEdit("plannedDate", version.plannedDate)}
                onSave={saveEdit}
                onChange={setEditValue}
                onCancel={() => setEditField(null)}
                type="date"
              />

              {/* Assignee */}
              <EditableRow
                label="负责人"
                value={editField === "assignee" ? editValue : version.assignee || "—"}
                isEditing={editField === "assignee"}
                disabled={isLocked}
                onEdit={() => startEdit("assignee", version.assignee)}
                onSave={saveEdit}
                onChange={setEditValue}
                onCancel={() => setEditField(null)}
              />

              {/* Status */}
              <div className="flex items-center justify-between py-0.5">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">状态</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  version.status === "planning"
                    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    : version.status === "in_dev"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                }`}>
                  {version.status === "planning" ? "规划中" : version.status === "in_dev" ? "开发中" : "已发布"}
                </span>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  关联需求
                  <span className="ml-2 text-xs font-normal text-gray-400">{versionReqs.length} 个</span>
                </h3>
                {!isLocked && (
                  <button
                    onClick={() => setAddReqOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" />添加需求
                  </button>
                )}
              </div>

              {versionReqs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-6 text-center">
                  <p className="text-xs text-gray-400">暂未关联需求</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versionReqs.map((req) => {
                    const p = reqProgress(req);
                    return (
                      <div key={req.id} className="rounded-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-4 group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-gray-400 shrink-0">{req.id}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{req.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusMeta[req.status]?.color || ""}`}>
                              {statusMeta[req.status]?.label || req.status}
                            </span>
                            {!isLocked && (
                              <button
                                onClick={() => setRemoveConfirm(req.id)}
                                className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${p}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 w-7 text-right">{p}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Release Info */}
            {version.status === "released" && version.releaseNote && (
              <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">发布记录</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{version.releaseNote}</p>
              </div>
            )}

            {/* Retrospective */}
            {version.retrospective && (
              <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">复盘记录</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{version.retrospective}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Requirement Dialog */}
      <AddRequirementDialog
        open={addReqOpen}
        onClose={() => setAddReqOpen(false)}
        availableReqs={availableReqs}
        onConfirm={handleAddReqs}
      />

      {/* Remove Confirmation */}
      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>移除需求</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">确定要从该版本中移除此需求吗？需求本身不会被删除。</p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setRemoveConfirm(null)} className="rounded-xl">取消</Button>
            <Button onClick={() => removeConfirm && handleRemoveReq(removeConfirm)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">移除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline editable row helper
function EditableRow({
  label,
  value,
  isEditing,
  disabled,
  onEdit,
  onSave,
  onChange,
  onCancel,
  type = "text",
}: {
  label: string;
  value: string;
  isEditing: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onChange: (v: string) => void;
  onCancel: () => void;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-1.5 ml-3">
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 text-sm rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 w-40"
            autoFocus
          />
          <button onClick={onSave} className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"><Check className="w-3 h-3" /></button>
          <button onClick={onCancel} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 group ml-3">
          <span className="text-sm text-gray-700 dark:text-gray-300 text-right">{value}</span>
          {!disabled && (
            <button onClick={onEdit} className="p-0.5 rounded text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all"><Pencil className="w-3 h-3" /></button>
          )}
        </div>
      )}
    </div>
  );
}

// Add Requirement Dialog
function AddRequirementDialog({
  open,
  onClose,
  availableReqs,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  availableReqs: PoolRequirement[];
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>添加需求</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          {availableReqs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">所有需求已关联到此版本</p>
          ) : (
            availableReqs.map((req) => (
              <label
                key={req.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected.has(req.id)
                    ? "border-teal-300 dark:border-teal-600 bg-teal-50/50 dark:bg-teal-900/10"
                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(req.id)}
                  onChange={() => toggle(req.id)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400">{req.id}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{req.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">{req.module}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusMeta[req.status]?.color || ""}`}>
                      {statusMeta[req.status]?.label}
                    </span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">取消</Button>
          <Button
            onClick={() => onConfirm(Array.from(selected))}
            disabled={selected.size === 0}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
          >
            关联选中 ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
