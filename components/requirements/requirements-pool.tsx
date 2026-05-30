"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Send, MessageSquare, Trash2, Lock } from "lucide-react";
import { canEdit } from "@/lib/permissions";
import {
  PoolRequirement,
  getPoolRequirements,
  addPoolRequirement,
  updatePoolRequirement,
  deletePoolRequirement,
  getVersions,
  getComments,
  addComment,
  addLog,
  StoredVersion,
  StoredComment,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

// ── Extended types for fields persisted via spread but not in the base interface ──

interface ExtendedPoolRequirement extends PoolRequirement {
  description?: string;
  acceptanceCriteria?: string;
  versionId?: string;
}

// ── Metadata ──

const statusMeta: Record<string, { label: string; color: string }> = {
  planning:    { label: "待评审", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  in_progress: { label: "开发中", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  review:      { label: "测试中", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  done:        { label: "已上线", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  backlog:     { label: "已拒绝", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const priorityMeta: Record<string, string> = {
  p0: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  p1: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  p2: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  p3: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const sortOptions = [
  { value: "createdAt", label: "创建时间" },
  { value: "priority", label: "优先级" },
  { value: "status", label: "状态" },
];

// ── Helpers ──

const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
const statusOrder: Record<string, number> = { planning: 0, in_progress: 1, review: 2, done: 3, backlog: 4 };

// ── Component ──

export function RequirementsPool() {
  // Data
  const [requirements, setRequirements] = useState<PoolRequirement[]>([]);
  const [versions, setVersions] = useState<StoredVersion[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Filters & sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [versionFilter, setVersionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<ExtendedPoolRequirement | null>(null);
  const [drawerForm, setDrawerForm] = useState<ExtendedPoolRequirement | null>(null);
  const [drawerDirty, setDrawerDirty] = useState(false);

  // Comments
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    module: "",
    priority: "p2" as PoolRequirement["priority"],
    assignee: "",
  });

  // Confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{ id: string; newStatus: string } | null>(null);

  // ── Init & refresh ──

  const refresh = () => {
    setRequirements(getPoolRequirements());
    setVersions(getVersions());
  };

  useEffect(() => {
    refresh();
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (selectedReq) setComments(getComments(selectedReq.id));
  }, [selectedReq?.id]);

  // Keyboard: Escape to close drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [drawerOpen, drawerDirty]);

  // ── Filter & sort ──

  const filtered = requirements
    .filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
      if (versionFilter !== "all") {
        const ext = r as ExtendedPoolRequirement;
        if (ext.versionId !== versionFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
        case "status":
          return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });

  // ── Drawer ──

  const openDrawer = (req: PoolRequirement) => {
    const ext = req as ExtendedPoolRequirement;
    setSelectedReq(ext);
    setDrawerForm({ ...ext });
    setDrawerDirty(false);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (drawerDirty) {
      if (!confirm("有未保存的更改，确定关闭吗？")) return;
    }
    setDrawerOpen(false);
    setSelectedReq(null);
    setDrawerForm(null);
    setDrawerDirty(false);
  };

  const saveDrawer = () => {
    if (!drawerForm || !selectedReq) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePoolRequirement(selectedReq.id, drawerForm as any);
    showToast("保存成功", "success");
    addLog("update", `需求 ${selectedReq.id}`, `更新了需求 "${drawerForm.title}"`);
    const updated = { ...selectedReq, ...drawerForm };
    setSelectedReq(updated);
    setDrawerDirty(false);
    refresh();
  };

  // ── Status change with confirm ──

  const handleStatusChange = (newStatus: string) => {
    if (!selectedReq || selectedReq.status === newStatus) return;
    setStatusChangeConfirm({ id: selectedReq.id, newStatus });
  };

  const confirmStatusChange = () => {
    if (!statusChangeConfirm || !selectedReq) return;
    const { newStatus } = statusChangeConfirm;
    const oldLabel = statusMeta[selectedReq.status]?.label ?? selectedReq.status;
    const newLabel = statusMeta[newStatus]?.label ?? newStatus;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePoolRequirement(selectedReq.id, { status: newStatus } as any);
    showToast(`状态已更新: ${oldLabel} → ${newLabel}`, "success");
    addLog("status_change", `需求 ${selectedReq.id}`, `${oldLabel} → ${newLabel}`);
    const updated = { ...selectedReq, status: newStatus } as ExtendedPoolRequirement;
    setSelectedReq(updated);
    setDrawerForm(updated);
    setDrawerDirty(false);
    setStatusChangeConfirm(null);
    refresh();
  };

  // ── Delete ──

  const handleDelete = (id: string) => {
    const req = requirements.find((r) => r.id === id);
    deletePoolRequirement(id);
    showToast("已删除", "success");
    if (req) addLog("delete", `需求 ${id}`, `删除了需求 "${req.title}"`);
    setDrawerOpen(false);
    setSelectedReq(null);
    setDrawerForm(null);
    setDeleteConfirm(null);
    refresh();
  };

  // ── Create ──

  const handleCreate = () => {
    if (!createForm.title.trim()) return;
    addPoolRequirement({ ...createForm, status: "planning", impact: 5, effort: 5 });
    showToast("需求已创建", "success");
    addLog("create", "需求池", `创建了新需求 "${createForm.title}"`);
    setCreateOpen(false);
    setCreateForm({ title: "", module: "", priority: "p2", assignee: "" });
    refresh();
  };

  // ── Comments ──

  const sendComment = () => {
    if (!commentText.trim() || !selectedReq) return;
    addComment({
      requirementId: selectedReq.id,
      author: commentAuthor.trim() || "匿名用户",
      text: commentText.trim(),
      mentions: [],
    });
    addLog("comment", `需求 ${selectedReq.id}`, `添加了评论`);
    setComments(getComments(selectedReq.id));
    setCommentText("");
  };

  // ── Shared input style ──

  const inputCls =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors";

  const selectCls =
    "rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors";

  // ── Render ──

  if (!loaded) return null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* ═══════════════════════════════════════════ Toolbar ═══════════════════════════════════════════ */}

      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            placeholder="搜索需求标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
          <option value="all">全部状态</option>
          {Object.entries(statusMeta).map(([k, m]) => (
            <option key={k} value={k}>{m.label}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectCls}>
          <option value="all">全部优先级</option>
          <option value="p0">P0</option>
          <option value="p1">P1</option>
          <option value="p2">P2</option>
          <option value="p3">P3</option>
        </select>

        {/* Version filter */}
        <select value={versionFilter} onChange={(e) => setVersionFilter(e.target.value)} className={selectCls}>
          <option value="all">全部版本</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id}>{v.version} {v.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>按{o.label}</option>
          ))}
        </select>

        {/* Create button */}
        {canEdit() ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />新建需求
          </button>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <Lock className="w-3.5 h-3.5" />只读模式
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════ List ═══════════════════════════════════════════ */}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3 w-[100px]">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">需求标题</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">模块</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">优先级</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">负责人</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">创建日期</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => openDrawer(req)}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{req.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{req.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{req.module || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${statusMeta[req.status]?.color ?? ""}`}>
                      {statusMeta[req.status]?.label ?? req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${priorityMeta[req.priority]}`}>
                      {req.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-300 shrink-0">
                        {req.assignee?.[0] || "?"}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{req.assignee || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{req.createdAt}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">没有匹配的需求</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">尝试调整筛选条件或新建需求</p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════ Drawer Backdrop ═══════════════════════════════════════════ */}

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition-opacity duration-300"
          onClick={closeDrawer}
        />
      )}

      {/* ═══════════════════════════════════════════ Detail Drawer ═══════════════════════════════════════════ */}

      <div
        className={`fixed right-0 top-0 h-full z-50 w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {drawerForm && selectedReq && (
          <>
            {/* ── Drawer header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-gray-400 shrink-0">{selectedReq.id}</span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">需求详情</h3>
              </div>
              <button
                onClick={closeDrawer}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Drawer body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">标题</label>
                <input
                  value={drawerForm.title}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, title: e.target.value }); setDrawerDirty(true); }}
                  className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">描述</label>
                <textarea
                  value={drawerForm.description ?? ""}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, description: e.target.value }); setDrawerDirty(true); }}
                  rows={3}
                  placeholder="需求描述、背景、目标..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Acceptance Criteria */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">验收标准</label>
                <textarea
                  value={drawerForm.acceptanceCriteria ?? ""}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, acceptanceCriteria: e.target.value }); setDrawerDirty(true); }}
                  rows={3}
                  placeholder="验收标准、测试要点..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">状态</label>
                <select
                  value={drawerForm.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={selectCls + " w-full"}
                >
                  {Object.entries(statusMeta).map(([k, m]) => (
                    <option key={k} value={k}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">优先级</label>
                <select
                  value={drawerForm.priority}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, priority: e.target.value as PoolRequirement["priority"] }); setDrawerDirty(true); }}
                  className={selectCls + " w-full"}
                >
                  <option value="p0">P0 - 紧急</option>
                  <option value="p1">P1 - 高</option>
                  <option value="p2">P2 - 中</option>
                  <option value="p3">P3 - 低</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">负责人</label>
                <input
                  value={drawerForm.assignee}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, assignee: e.target.value }); setDrawerDirty(true); }}
                  placeholder="负责人姓名"
                  className={inputCls}
                />
              </div>

              {/* Version */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">所属版本</label>
                <select
                  value={drawerForm.versionId ?? ""}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, versionId: e.target.value || undefined }); setDrawerDirty(true); }}
                  className={selectCls + " w-full"}
                >
                  <option value="">未分配</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.version} {v.name}</option>
                  ))}
                </select>
              </div>

              {/* Created at (read-only) */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">创建时间</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedReq.createdAt}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {canEdit() ? (
                  <>
                    <button
                      onClick={saveDrawer}
                      className="flex-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(selectedReq.id)}
                      className="rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 py-2">
                    <Lock className="w-3.5 h-3.5" />只读模式 — 无法编辑或删除
                  </p>
                )}
              </div>

              {/* ── Comments section ── */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    评论 ({comments.length})
                  </h4>
                </div>

                {/* Comment list */}
                {comments.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-52 overflow-y-auto">
                    {comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[9px] font-medium text-gray-600 dark:text-gray-300 shrink-0">
                            {c.author[0] ?? "?"}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{c.author}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                            {new Date(c.createdAt).toLocaleString("zh-CN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">{c.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">暂无评论</p>
                )}

                {/* Comment input */}
                <div className="space-y-2">
                  <input
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="你的名字"
                    className={`${inputCls} !py-1.5 !text-xs`}
                  />
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                      placeholder="输入评论... (Enter 发送)"
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      onClick={sendComment}
                      disabled={!commentText.trim()}
                      className="rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom spacer for comfortable scroll */}
              <div className="h-4" />
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════ Create Modal ═══════════════════════════════════════════ */}

      {createOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 transition-opacity" onClick={() => setCreateOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">新建需求</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">需求标题 *</label>
                <input
                  placeholder="如：用户个人主页改版"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">模块</label>
                <input
                  placeholder="如：用户中心"
                  value={createForm.module}
                  onChange={(e) => setCreateForm({ ...createForm, module: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">优先级</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as PoolRequirement["priority"] })}
                  className={selectCls + " w-full"}
                >
                  <option value="p0">P0 - 紧急</option>
                  <option value="p1">P1 - 高</option>
                  <option value="p2">P2 - 中</option>
                  <option value="p3">P3 - 低</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">负责人</label>
                <input
                  placeholder="如：Alex"
                  value={createForm.assignee}
                  onChange={(e) => setCreateForm({ ...createForm, assignee: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.title.trim()}
                className="rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ Delete Confirmation ═══════════════════════════════════════════ */}

      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 transition-opacity" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">此操作不可撤销，确定要删除该需求吗？</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-600 dark:bg-red-700 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ Status Change Confirmation ═══════════════════════════════════════════ */}

      {statusChangeConfirm && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 transition-opacity" onClick={() => setStatusChangeConfirm(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">确认状态变更</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              将状态从{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {statusMeta[selectedReq?.status ?? ""]?.label ?? selectedReq?.status}
              </span>{" "}
              变更为{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {statusMeta[statusChangeConfirm.newStatus]?.label}
              </span>
              ？
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStatusChangeConfirm(null)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmStatusChange}
                className="rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                确认变更
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
