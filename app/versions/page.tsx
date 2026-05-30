"use client";

import { useState, useEffect, useCallback } from "react";
import { GitBranch, Plus, Pencil, Trash2, Rocket, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StoredVersion,
  getVersions,
  deleteVersion,
  getPoolRequirements,
  addLog,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { VersionDetail } from "@/components/versions/version-detail";
import { VersionForm } from "@/components/versions/version-form";
import { ReleaseRetro } from "@/components/versions/release-retro";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const statusMeta: Record<string, { label: string; color: string }> = {
  planning: { label: "规划中", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  in_dev: { label: "开发中", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  released: { label: "已发布", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export default function VersionsPage() {
  const [versions, setVersions] = useState<StoredVersion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<StoredVersion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StoredVersion | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<StoredVersion | null>(null);

  const poolReqs = getPoolRequirements();

  const refresh = useCallback(() => {
    setVersions(getVersions());
  }, []);

  useEffect(() => {
    refresh();
    setLoaded(true);
  }, [refresh]);

  const calcProgress = (version: StoredVersion) => {
    if (!version.requirementIds || version.requirementIds.length === 0) return 0;
    const matched = poolReqs.filter((r) => version.requirementIds.includes(r.id));
    if (matched.length === 0) return 0;
    const done = matched.filter((r) => r.status === "done").length;
    return Math.round((done / matched.length) * 100);
  };

  const openDetail = (v: StoredVersion) => {
    setSelectedVersion(v);
    setDetailOpen(true);
  };

  const openEdit = (v: StoredVersion) => {
    setEditTarget(v);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteVersion(deleteConfirm);
    addLog("删除版本", deleteConfirm, `版本已删除`);
    showToast("版本已删除", "success");
    setDeleteConfirm(null);
    refresh();
  };

  const handleReleaseClick = (v: StoredVersion) => {
    setReleaseTarget(v);
  };

  const handleReleaseDone = () => {
    setReleaseTarget(null);
    refresh();
  };

  const handleFormSaved = () => {
    setFormOpen(false);
    setEditTarget(null);
    refresh();
  };

  const handleDetailUpdated = () => {
    refresh();
  };

  if (!loaded) return null;

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-teal-200/60 dark:from-teal-500/15 to-transparent pointer-events-none" />

      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">版本管理</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">版本规划、需求关联、发布与复盘</p>
          </div>
          <div className="ml-auto">
            <Button
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />新建版本
            </Button>
          </div>
        </div>
      </div>

      {/* Version List */}
      <div className="animate-fade-in">
        {versions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm p-12 text-center">
            <GitBranch className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" strokeWidth={1} />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">还没有版本，创建第一个</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">点击&ldquo;新建版本&rdquo;开始规划迭代</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5">版本号</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5">版本名称</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5">计划日期</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5">状态</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5">需求进度</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5">负责人</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase px-5 py-3.5 w-[140px]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((v) => {
                    const progress = calcProgress(v);
                    return (
                      <tr
                        key={v.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                        onClick={() => openDetail(v)}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{v.version}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{v.plannedDate || "-"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMeta[v.status]?.color || ""}`}>
                            {statusMeta[v.status]?.label || v.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300">
                              {v.assignee?.[0] || "?"}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-300">{v.assignee || "-"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openDetail(v)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(v)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="编辑"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {v.status !== "released" && (
                              <button
                                onClick={() => handleReleaseClick(v)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="发布"
                              >
                                <Rocket className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(v.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <VersionDetail
        version={selectedVersion}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedVersion(null); }}
        onUpdated={handleDetailUpdated}
      />

      {/* Create/Edit Dialog */}
      <VersionForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        version={editTarget}
        onSaved={handleFormSaved}
      />

      {/* Release Retro Dialog */}
      <ReleaseRetro
        version={releaseTarget}
        onClose={() => setReleaseTarget(null)}
        onDone={handleReleaseDone}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">此操作不可撤销，确定要删除该版本吗？关联的需求不会被删除。</p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">取消</Button>
            <Button onClick={handleDelete} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
