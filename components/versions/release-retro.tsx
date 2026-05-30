"use client";

import { useState, useEffect } from "react";
import { Rocket, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  StoredVersion,
  getPoolRequirements,
  updateVersion,
  addLog,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

interface ReleaseRetroProps {
  version: StoredVersion | null;
  onClose: () => void;
  onDone: () => void;
}

export function ReleaseRetro({ version, onClose, onDone }: ReleaseRetroProps) {
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);
  const [retroOpen, setRetroOpen] = useState(false);
  const [retroForm, setRetroForm] = useState({
    plannedCount: 0,
    actualCount: 0,
    delayReason: "",
    improvements: "",
  });

  useEffect(() => {
    if (version && retroOpen) {
      const allReqs = getPoolRequirements();
      const versionReqs = allReqs.filter((r) => version.requirementIds?.includes(r.id));
      const doneCount = versionReqs.filter((r) => r.status === "done").length;
      setRetroForm({
        plannedCount: version.requirementIds?.length || 0,
        actualCount: doneCount,
        delayReason: "",
        improvements: "",
      });
    }
  }, [version, retroOpen]);

  if (!version) return null;

  const handleRelease = () => {
    const now = new Date().toISOString().slice(0, 10);
    const note = `于 ${now} 发布，共关联 ${version.requirementIds?.length || 0} 个需求`;
    updateVersion(version.id, {
      status: "released",
      releaseNote: note,
    });
    addLog("发布版本", version.version, note);
    showToast(`版本 ${version.version} 已发布`, "success");
    setReleaseConfirmOpen(false);
    onDone();
  };

  const handleRetroSave = () => {
    const allReqs = getPoolRequirements();
    const versionReqs = allReqs.filter((r) => version.requirementIds?.includes(r.id));
    const doneCount = versionReqs.filter((r) => r.status === "done").length;
    const totalCount = versionReqs.length;
    const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const content = [
      `计划完成数：${retroForm.plannedCount}`,
      `实际完成数：${retroForm.actualCount}`,
      `完成率：${rate}%`,
      retroForm.delayReason ? `延期原因：${retroForm.delayReason}` : "",
      retroForm.improvements ? `改进点：${retroForm.improvements}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    updateVersion(version.id, { retrospective: content });
    addLog("版本复盘", version.version, `完成率 ${rate}%`);
    showToast("复盘记录已保存", "success");
    setRetroOpen(false);
    onDone();
  };

  return (
    <>
      {/* Release main dialog */}
      <Dialog open={!!version && !releaseConfirmOpen && !retroOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>发布版本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">版本号</span>
                <span className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{version.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">版本名称</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{version.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">关联需求</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{version.requirementIds?.length || 0} 个</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">负责人</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{version.assignee || "—"}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setReleaseConfirmOpen(true)}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Rocket className="w-4 h-4 mr-1.5" />确认发布
              </Button>
              <Button
                variant="outline"
                onClick={() => setRetroOpen(true)}
                className="flex-1 rounded-xl"
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />复盘
              </Button>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="rounded-xl">取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release confirmation */}
      <Dialog open={releaseConfirmOpen} onOpenChange={() => setReleaseConfirmOpen(false)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>确认发布</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            发布后版本将标记为&ldquo;已发布&rdquo;，发布时间将被记录。已发布的版本将锁定，无法再添加或移除需求。确定要发布吗？
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setReleaseConfirmOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleRelease} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">确认发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retrospective dialog */}
      <Dialog open={retroOpen} onOpenChange={() => setRetroOpen(false)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>版本复盘</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 mt-2">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">计划完成数</label>
                  <input
                    type="number"
                    min={0}
                    value={retroForm.plannedCount}
                    onChange={(e) => setRetroForm({ ...retroForm, plannedCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">实际完成数</label>
                  <input
                    type="number"
                    min={0}
                    value={retroForm.actualCount}
                    onChange={(e) => setRetroForm({ ...retroForm, actualCount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">完成率</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {retroForm.plannedCount > 0
                    ? Math.round((retroForm.actualCount / retroForm.plannedCount) * 100)
                    : 0}%
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">延期原因</label>
              <textarea
                placeholder="记录延期的主要原因..."
                value={retroForm.delayReason}
                onChange={(e) => setRetroForm({ ...retroForm, delayReason: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">改进点</label>
              <textarea
                placeholder="记录改进建议..."
                value={retroForm.improvements}
                onChange={(e) => setRetroForm({ ...retroForm, improvements: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setRetroOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleRetroSave} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white">保存复盘</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
