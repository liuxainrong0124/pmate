"use client";

import { useState, useEffect } from "react";
import { Search, Plus, X, Send, MessageSquare, Trash2, Lock, Clock, AlertTriangle as AlertIcon, Sparkles, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
import { canEdit } from "@/lib/permissions";
import {
  PoolRequirement,
  getPoolRequirements,
  addPoolRequirement,
  updatePoolRequirement,
  deletePoolRequirement,
  approvePoolRequirement,
  rejectPoolRequirement,
  getVersions,
  getComments,
  addComment,
  addLog,
  getRequirementVersions,
  StoredVersion,
  StoredComment,
  StoredRequirementVersion,
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

  // Version history
  const [reqVersions, setReqVersions] = useState<StoredRequirementVersion[]>([]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    module: "",
    priority: "p2" as PoolRequirement["priority"],
    assignee: "",
    backupAssignee: "",
    dueDate: "",
  });

  // Filter: show only overdue
  const [showOverdue, setShowOverdue] = useState(false);

  // ── Overdue detection ──
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = (req: PoolRequirement) => {
    if (!req.dueDate) return false;
    if (req.status === "done" || req.status === "backlog") return false;
    return req.dueDate < today;
  };
  const overdueCount = requirements.filter(isOverdue).length;

  // Confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{ id: string; newStatus: string } | null>(null);

  // AI Review
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<{
    score: number; summary: string; strengths: string[];
    issues: { severity: string; category: string; description: string; suggestion: string }[];
    missingScenarios: string[]; acceptanceCriteriaQuality: string; readyForDev: boolean;
  } | null>(null);

  // Batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = new Set(filtered.map((r) => r.id));
    if (selectedIds.size === allIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allIds);
    }
  };

  const batchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.size} 条需求吗？此操作不可撤销。`)) return;
    let count = 0;
    selectedIds.forEach((id) => {
      deletePoolRequirement(id);
      count++;
    });
    showToast(`已删除 ${count} 条需求`, "success");
    addLog("批量删除", "需求", `批量删除 ${count} 条需求`);
    setSelectedIds(new Set());
    refresh();
  };

  const batchChangeStatus = (newStatus: string) => {
    if (selectedIds.size === 0) return;
    let count = 0;
    selectedIds.forEach((id) => {
      updatePoolRequirement(id, { status: newStatus as PoolRequirement["status"] });
      count++;
    });
    showToast(`已更新 ${count} 条需求状态`, "success");
    addLog("批量更新", "需求", `批量更新 ${count} 条需求状态为 ${statusMeta[newStatus]?.label || newStatus}`);
    setSelectedIds(new Set());
    refresh();
  };

  const batchChangePriority = (newPriority: string) => {
    if (selectedIds.size === 0) return;
    let count = 0;
    selectedIds.forEach((id) => {
      updatePoolRequirement(id, { priority: newPriority as PoolRequirement["priority"] });
      count++;
    });
    showToast(`已更新 ${count} 条需求优先级`, "success");
    addLog("批量更新", "需求", `批量更新 ${count} 条需求优先级为 ${newPriority}`);
    setSelectedIds(new Set());
    refresh();
  };

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
    if (selectedReq) {
      setComments(getComments(selectedReq.id));
      setReqVersions(getRequirementVersions(selectedReq.id));
    }
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
      if (showOverdue && !isOverdue(r)) return false;
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
    setDrawerOpen(false);
    setSelectedReq(null);
    setDrawerForm(null);
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
    addPoolRequirement({ ...createForm, status: "planning", impact: 5, effort: 5, backupAssignee: createForm.backupAssignee, approvalStatus: "pending" });
    showToast("需求已创建", "success");
    addLog("create", "需求池", `创建了新需求 "${createForm.title}"`);
    setCreateOpen(false);
    setCreateForm({ title: "", module: "", priority: "p2", assignee: "", backupAssignee: "", dueDate: "" });
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

  const handleAIReview = async () => {
    if (!selectedReq) return;
    setReviewing(true);
    setReviewResult(null);
    try {
      const res = await fetch("/api/requirement-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement: {
            title: selectedReq.title,
            description: (selectedReq as ExtendedPoolRequirement).description || "",
            acceptanceCriteria: (selectedReq as ExtendedPoolRequirement).acceptanceCriteria || "",
            module: selectedReq.module,
            priority: selectedReq.priority,
          },
        }),
      });
      if (!res.ok) throw new Error("评审请求失败");
      const data = await res.json();
      setReviewResult(data.review);
      addLog("ai_review", `需求 ${selectedReq.id}`, `AI 评审完成，评分: ${data.review.score}`);
    } catch {
      showToast("AI 评审失败，请检查 API Key", "error");
    } finally {
      setReviewing(false);
    }
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

      {/* ═══════════════════════════════════════════ Overdue Alert Banner ═══════════════════════════════════════════ */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm animate-fade-in">
          <AlertIcon className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-red-700 font-medium">
            {overdueCount} 条需求已逾期
          </span>
          <span className="text-xs text-red-500">
            请及时处理或更新截止日期
          </span>
          <button
            onClick={() => { setShowOverdue(true); setStatusFilter("all"); }}
            className="ml-auto text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
          >
            查看逾期需求
          </button>
          {showOverdue && (
            <button
              onClick={() => setShowOverdue(false)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ Batch actions ═══════════════════════════════════════════ */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm animate-fade-in">
          <span className="text-xs">已选 {selectedIds.size} 项</span>
          <div className="h-4 w-px bg-white/20 ml-1" />
          <select
            onChange={(e) => { if (e.target.value) batchChangeStatus(e.target.value); e.target.value = ""; }}
            className="text-xs bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="" className="text-gray-900">修改状态...</option>
            {Object.entries(statusMeta).map(([k, v]) => (
              <option key={k} value={k} className="text-gray-900">{v.label}</option>
            ))}
          </select>
          <select
            onChange={(e) => { if (e.target.value) batchChangePriority(e.target.value); e.target.value = ""; }}
            className="text-xs bg-white/10 border border-white/20 rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            <option value="" className="text-gray-900">修改优先级...</option>
            <option value="p0" className="text-gray-900">P0</option>
            <option value="p1" className="text-gray-900">P1</option>
            <option value="p2" className="text-gray-900">P2</option>
            <option value="p3" className="text-gray-900">P3</option>
          </select>
          <button
            onClick={batchDelete}
            className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-200 px-2 py-1 rounded-lg transition-colors ml-auto"
          >
            删除选中
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-white/60 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════ List ═══════════════════════════════════════════ */}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3 w-[40px]">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3 w-[100px]">ID</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">需求标题</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">模块</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">优先级</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">负责人</th>
                <th className="text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase px-4 py-3">截止日期</th>
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
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(req.id)}
                      onChange={() => toggleSelect(req.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
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
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full ${statusMeta[req.status]?.color ?? ""}`}>
                        {statusMeta[req.status]?.label ?? req.status}
                      </span>
                      {(req as PoolRequirement & { approvalStatus?: string }).approvalStatus === "pending" && (
                        <span className="inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700">待审批</span>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      {isOverdue(req) && (
                        <Clock className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs ${isOverdue(req) ? "text-red-600 font-medium" : "text-gray-400 dark:text-gray-500"}`}>
                        {req.dueDate || "—"}
                      </span>
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

              {/* Backup Assignee */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">备份负责人</label>
                <input
                  value={(drawerForm as ExtendedPoolRequirement & { backupAssignee?: string }).backupAssignee ?? ""}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, backupAssignee: e.target.value } as ExtendedPoolRequirement); setDrawerDirty(true); }}
                  placeholder="备份负责人（可选）"
                  className={inputCls}
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">截止日期</label>
                <input
                  type="date"
                  value={drawerForm.dueDate ?? ""}
                  onChange={(e) => { setDrawerForm({ ...drawerForm, dueDate: e.target.value }); setDrawerDirty(true); }}
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

              {/* Approval Section */}
              {canEdit() && (selectedReq as PoolRequirement & { approvalStatus?: string }).approvalStatus === "pending" && (
                <div className="rounded-xl border border-yellow-200 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-500/10 p-4">
                  <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-3">该需求等待审批</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        approvePoolRequirement(selectedReq.id, "当前用户");
                        showToast("已审批通过", "success");
                        addLog("approve", `需求 ${selectedReq.id}`, "审批通过");
                        closeDrawer();
                        refresh();
                      }}
                      className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-2 transition-colors"
                    >
                      审批通过
                    </button>
                    <button
                      onClick={() => {
                        rejectPoolRequirement(selectedReq.id, "当前用户");
                        showToast("已拒绝", "success");
                        addLog("reject", `需求 ${selectedReq.id}`, "审批拒绝");
                        closeDrawer();
                        refresh();
                      }}
                      className="flex-1 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              )}
              {(selectedReq as PoolRequirement & { approvalStatus?: string; approvedBy?: string; approvedAt?: string }).approvalStatus === "approved" && (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    已审批通过 · {(selectedReq as PoolRequirement & { approvedBy?: string }).approvedBy} · {new Date((selectedReq as PoolRequirement & { approvedAt?: string }).approvedAt || "").toLocaleDateString("zh-CN")}
                  </p>
                </div>
              )}

              {/* AI Review Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">AI 需求评审</h4>
                  </div>
                  <button
                    onClick={handleAIReview}
                    disabled={reviewing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white text-xs font-medium transition-colors"
                  >
                    {reviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {reviewing ? "评审中..." : reviewResult ? "重新评审" : "AI 评审"}
                  </button>
                </div>

                {reviewing && (
                  <div className="flex items-center gap-2 py-4 justify-center text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 正在分析需求的完整性、可测试性、边界条件...
                  </div>
                )}

                {reviewResult && !reviewing && (
                  <div className="space-y-3 animate-fade-in">
                    {/* Score */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <div className={`text-2xl font-bold ${reviewResult.score >= 70 ? "text-emerald-600" : reviewResult.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
                        {reviewResult.score}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">评审分数</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{reviewResult.summary}</p>
                      </div>
                      {reviewResult.readyForDev ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-amber-500 ml-auto" />
                      )}
                    </div>

                    {/* Strengths */}
                    {reviewResult.strengths.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">做得好的地方</p>
                        {reviewResult.strengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Issues */}
                    {reviewResult.issues.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">发现的问题</p>
                        <div className="space-y-2">
                          {reviewResult.issues.map((issue, i) => (
                            <div key={i} className={`rounded-lg p-2.5 ${
                              issue.severity === "critical" ? "bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20" :
                              issue.severity === "major" ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20" :
                              "bg-gray-50 dark:bg-gray-800/50"
                            }`}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  issue.severity === "critical" ? "bg-red-100 text-red-700" :
                                  issue.severity === "major" ? "bg-amber-100 text-amber-700" :
                                  "bg-gray-200 text-gray-600"
                                }`}>{issue.severity === "critical" ? "严重" : issue.severity === "major" ? "重要" : "建议"}</span>
                                <span className="text-[10px] text-gray-400">{issue.category}</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">{issue.description}</p>
                              <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-1">建议: {issue.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing scenarios */}
                    {reviewResult.missingScenarios.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">缺少的边界/异常场景</p>
                        {reviewResult.missingScenarios.map((s, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                            <AlertIcon className="w-3 h-3 mt-0.5 shrink-0" />{s}
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400">
                      验收标准质量: {reviewResult.acceptanceCriteriaQuality === "good" ? "✅ 充分" : reviewResult.acceptanceCriteriaQuality === "adequate" ? "⚡ 基本合格" : "❌ 不足"} ·
                      可进入开发: {reviewResult.readyForDev ? "✅ 是" : "❌ 否"}
                    </p>
                  </div>
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

              {/* ── Version History ── */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    变更历史 ({reqVersions.length})
                  </h4>
                </div>
                {reqVersions.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {reqVersions.map((v) => (
                      <div key={v.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] text-gray-400">
                            {new Date(v.changedAt).toLocaleString("zh-CN", {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                          <span className="text-[10px] text-gray-500">·</span>
                          <span className="text-[10px] text-gray-500">{v.changedBy}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                          <span>状态: <span className="font-medium">{statusMeta[v.snapshot.status]?.label ?? v.snapshot.status}</span></span>
                          <span>优先级: <span className="font-medium">{v.snapshot.priority.toUpperCase()}</span></span>
                          <span>负责人: <span className="font-medium">{v.snapshot.assignee || "—"}</span></span>
                          <span>模块: <span className="font-medium">{v.snapshot.module || "—"}</span></span>
                          {v.snapshot.dueDate && <span>截止: <span className="font-medium">{v.snapshot.dueDate}</span></span>}
                          {v.snapshot.description && (
                            <span className="col-span-2 line-clamp-1 text-gray-400">描述: {v.snapshot.description}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500">首次编辑后将自动记录变更历史</p>
                )}
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
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">备份负责人</label>
                <input
                  placeholder="如：小明（可选）"
                  value={createForm.backupAssignee}
                  onChange={(e) => setCreateForm({ ...createForm, backupAssignee: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">截止日期</label>
                <input
                  type="date"
                  value={createForm.dueDate}
                  onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
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
