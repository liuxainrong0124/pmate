// Client-side persistence — localStorage-backed store for requirements, docs, metrics
// Falls back gracefully when localStorage is unavailable (SSR)

function getStore(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("pulse_store");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setStore(data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("pulse_store", JSON.stringify(data)); } catch { /* quota exceeded */ }
}

export function getItem<T>(key: string, fallback: T): T {
  const store = getStore();
  return (store[key] as T) ?? fallback;
}

export function setItem<T>(key: string, value: T) {
  const store = getStore();
  store[key] = value;
  setStore(store);
}

export function getAllKeys(): string[] {
  return Object.keys(getStore());
}

// ── Typed helpers ──

export interface StoredRequirement {
  id: string;
  title: string;
  description: string;
  status: "proposed" | "analyzing" | "approved" | "in_dev" | "done" | "rejected";
  priority: "p0" | "p1" | "p2" | "p3";
  module: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredDoc {
  id: string;
  title: string;
  content: string;
  type: "prd" | "report" | "guide" | "data" | "external";
  category: string;
  tags: string[];
  format: string;
  updatedAt: string;
}

export interface StoredMetric {
  id: string;
  label: string;
  values: number[];
  dates: string[];
}

export function getRequirements(): StoredRequirement[] {
  return getItem<StoredRequirement[]>("requirements", []);
}

export function setRequirements(reqs: StoredRequirement[]) {
  setItem("requirements", reqs);
}

export function addRequirement(req: StoredRequirement) {
  const reqs = getRequirements();
  reqs.unshift(req);
  setRequirements(reqs);
}

export function updateRequirement(id: string, updates: Partial<StoredRequirement>) {
  const reqs = getRequirements();
  const idx = reqs.findIndex((r) => r.id === id);
  if (idx >= 0) { reqs[idx] = { ...reqs[idx], ...updates, updatedAt: new Date().toISOString() }; }
  setRequirements(reqs);
}

export function deleteRequirement(id: string) {
  setRequirements(getRequirements().filter((r) => r.id !== id));
}

export function getDocs(): StoredDoc[] {
  return getItem<StoredDoc[]>("docs", []);
}

export function setDocs(docs: StoredDoc[]) {
  setItem("docs", docs);
}

export function addDoc(doc: StoredDoc) {
  const docs = getDocs();
  const entry = { ...doc, id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  docs.unshift(entry);
  setDocs(docs);
}

export function deleteDoc(id: string) {
  setDocs(getDocs().filter((d) => d.id !== id));
}

export function getUploadedMetrics(): StoredMetric[] {
  return getItem<StoredMetric[]>("uploadedMetrics", []);
}

export function setUploadedMetrics(metrics: StoredMetric[]) {
  setItem("uploadedMetrics", metrics);
}

// ── Pool Requirements ──

export interface PoolRequirement {
  id: string;
  title: string;
  module: string;
  status: "planning" | "in_progress" | "review" | "done" | "backlog";
  priority: "p0" | "p1" | "p2" | "p3";
  impact: number;
  effort: number;
  assignee: string;
  createdAt: string;
}

function generateReqId(existing: PoolRequirement[]): string {
  const max = existing.reduce((m, r) => {
    const n = parseInt(r.id.replace("REQ-", ""), 10);
    return n > m ? n : m;
  }, 0);
  return `REQ-${String(max + 1).padStart(3, "0")}`;
}

const DEFAULT_POOL_REQS: PoolRequirement[] = [
  { id: "REQ-001", title: "用户个人主页改版", module: "用户中心", status: "in_progress", priority: "p0", impact: 9, effort: 7, assignee: "Alex", createdAt: "2026-05-20" },
  { id: "REQ-002", title: "推送消息 A/B 测试", module: "运营中心", status: "planning", priority: "p0", impact: 8, effort: 4, assignee: "小明", createdAt: "2026-05-21" },
  { id: "REQ-003", title: "数据看板导出功能", module: "数据洞察", status: "review", priority: "p1", impact: 6, effort: 3, assignee: "Alex", createdAt: "2026-05-19" },
  { id: "REQ-004", title: "用户画像标签体系", module: "用户中心", status: "backlog", priority: "p1", impact: 7, effort: 8, assignee: "小红", createdAt: "2026-05-18" },
  { id: "REQ-005", title: "竞品动态自动抓取", module: "竞品追踪", status: "planning", priority: "p2", impact: 5, effort: 6, assignee: "小明", createdAt: "2026-05-22" },
  { id: "REQ-006", title: "异常场景知识库", module: "需求中心", status: "done", priority: "p2", impact: 4, effort: 2, assignee: "Alex", createdAt: "2026-05-15" },
  { id: "REQ-007", title: "反馈情感趋势分析", module: "用户中心", status: "in_progress", priority: "p1", impact: 7, effort: 5, assignee: "小红", createdAt: "2026-05-23" },
  { id: "REQ-008", title: "运营活动模板库", module: "运营中心", status: "backlog", priority: "p3", impact: 3, effort: 4, assignee: "小明", createdAt: "2026-05-24" },
  { id: "REQ-009", title: "iOS 端适配优化", module: "基础设施", status: "planning", priority: "p1", impact: 6, effort: 5, assignee: "Alex", createdAt: "2026-05-25" },
  { id: "REQ-010", title: "PRD 模板自定义", module: "需求中心", status: "backlog", priority: "p3", impact: 3, effort: 3, assignee: "小红", createdAt: "2026-05-26" },
];

export function getPoolRequirements(): PoolRequirement[] {
  return getItem<PoolRequirement[]>("poolRequirements", DEFAULT_POOL_REQS);
}

export function setPoolRequirements(reqs: PoolRequirement[]) {
  setItem("poolRequirements", reqs);
}

export function addPoolRequirement(req: Omit<PoolRequirement, "id" | "createdAt">) {
  const reqs = getPoolRequirements();
  const now = new Date().toISOString().slice(0, 10);
  const entry: PoolRequirement = { ...req, id: generateReqId(reqs), createdAt: now };
  reqs.unshift(entry);
  setPoolRequirements(reqs);
  return entry;
}

export function updatePoolRequirement(id: string, updates: Partial<PoolRequirement>) {
  const reqs = getPoolRequirements();
  const idx = reqs.findIndex((r) => r.id === id);
  if (idx >= 0) { reqs[idx] = { ...reqs[idx], ...updates }; }
  setPoolRequirements(reqs);
}

export function deletePoolRequirement(id: string) {
  setPoolRequirements(getPoolRequirements().filter((r) => r.id !== id));
}

// ── Feedback History ──

export interface StoredFeedback {
  id: string;
  title: string;
  feedbackText: string;
  sentiment: "positive" | "neutral" | "negative";
  quote: string;
  category: string;
  source: string;
  date: string;
}

export function getFeedbackHistory(): StoredFeedback[] {
  return getItem<StoredFeedback[]>("feedbackHistory", []);
}

export function addFeedbackHistory(entry: StoredFeedback) {
  const history = getFeedbackHistory();
  history.unshift(entry);
  if (history.length > 50) history.length = 50;
  setItem("feedbackHistory", history);
}

// ── Settings ──

export interface StoredSettings {
  theme: "light" | "dark" | "system";
  pushNotifications: boolean;
  emailNotifications: boolean;
  language: string;
  deepseekApiKey: string;
  userName: string;
  email: string;
}

const DEFAULT_SETTINGS: StoredSettings = {
  theme: "light",
  pushNotifications: true,
  emailNotifications: false,
  language: "zh-CN",
  deepseekApiKey: "",
  userName: "Pulse 用户",
  email: "",
};

export function getSettings(): StoredSettings {
  return getItem<StoredSettings>("settings", DEFAULT_SETTINGS);
}

export function saveSettings(updates: Partial<StoredSettings>) {
  const current = getSettings();
  setItem("settings", { ...current, ...updates });
}

/** Returns user's API key from localStorage, or falls back to empty string */
export function getUserApiKey(): string {
  return getSettings().deepseekApiKey || "";
}

// ── Todos ──

export interface StoredTodo {
  id: string;
  text: string;
  time: string;
  done: boolean;
  priority: "high" | "medium" | "low";
  createdAt: string;
}

const DEFAULT_TODOS: StoredTodo[] = [
  { id: "todo-1", text: "需求评审会 — 准备异常场景文档", time: "14:00", done: false, priority: "high", createdAt: "2026-05-28" },
  { id: "todo-2", text: "运营推送审核 — 3 条待审", time: "16:00", done: false, priority: "high", createdAt: "2026-05-28" },
  { id: "todo-3", text: "数据异动排查 — 昨日留存 ↓5.1%", time: "今日", done: false, priority: "medium", createdAt: "2026-05-27" },
  { id: "todo-4", text: "周报整理 — Q2 第 8 周", time: "18:00", done: true, priority: "low", createdAt: "2026-05-27" },
];

export function getTodos(): StoredTodo[] {
  return getItem<StoredTodo[]>("todos", DEFAULT_TODOS);
}

export function setTodos(todos: StoredTodo[]) {
  setItem("todos", todos);
}

export function addTodo(todo: Omit<StoredTodo, "id" | "createdAt">) {
  const todos = getTodos();
  const entry: StoredTodo = {
    ...todo,
    id: `todo-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  todos.unshift(entry);
  setTodos(todos);
  return entry;
}

export function toggleTodo(id: string) {
  const todos = getTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx >= 0) { todos[idx].done = !todos[idx].done; }
  setTodos(todos);
}

export function deleteTodo(id: string) {
  setTodos(getTodos().filter((t) => t.id !== id));
}

// ── Content Library (push copies) ──

export interface StoredContent {
  id: string;
  title: string;
  content: string;
  style: string;
  segment: string;
  purpose: string;
  savedAt: string;
}

export function getContentLibrary(): StoredContent[] {
  return getItem<StoredContent[]>("contentLibrary", []);
}

export function addContent(content: Omit<StoredContent, "id" | "savedAt">) {
  const lib = getContentLibrary();
  const entry: StoredContent = {
    ...content,
    id: `content-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  lib.unshift(entry);
  if (lib.length > 50) lib.length = 50;
  setItem("contentLibrary", lib);
  return entry;
}

export function deleteContent(id: string) {
  setItem("contentLibrary", getContentLibrary().filter((c) => c.id !== id));
}

// ── Versions ──

export interface StoredVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  plannedDate: string;
  status: "planning" | "in_dev" | "released";
  assignee: string;
  requirementIds: string[];
  releaseNote: string;
  retrospective: string;
  createdAt: string;
}

const DEFAULT_VERSIONS: StoredVersion[] = [
  { id: "ver-1", version: "v2.0.0", name: "用户中心重构", description: "重构用户中心模块，新增画像标签体系", plannedDate: "2026-06-15", status: "in_dev", assignee: "Alex", requirementIds: ["REQ-001", "REQ-004", "REQ-007"], releaseNote: "", retrospective: "", createdAt: "2026-05-10" },
  { id: "ver-2", version: "v2.1.0", name: "运营能力增强", description: "A/B测试 + 活动管理 + 推送策略", plannedDate: "2026-07-01", status: "planning", assignee: "小明", requirementIds: ["REQ-002", "REQ-008"], releaseNote: "", retrospective: "", createdAt: "2026-05-20" },
];

export function getVersions(): StoredVersion[] {
  return getItem<StoredVersion[]>("versions", DEFAULT_VERSIONS);
}
export function setVersions(versions: StoredVersion[]) { setItem("versions", versions); }
export function addVersion(v: Omit<StoredVersion, "id" | "createdAt">) {
  const versions = getVersions();
  const entry: StoredVersion = { ...v, id: `ver-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
  versions.unshift(entry);
  setVersions(versions);
  return entry;
}
export function updateVersion(id: string, updates: Partial<StoredVersion>) {
  const versions = getVersions();
  const idx = versions.findIndex((v) => v.id === id);
  if (idx >= 0) versions[idx] = { ...versions[idx], ...updates };
  setVersions(versions);
}
export function deleteVersion(id: string) {
  setVersions(getVersions().filter((v) => v.id !== id));
}

// ── Activities ──

export interface StoredActivity {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  channels: string[];
  content: string;
  status: "upcoming" | "active" | "ended";
  participants: number;
  clickRate: number;
  conversionRate: number;
  templateId?: string;
  createdAt: string;
}

const DEFAULT_ACTIVITIES: StoredActivity[] = [
  { id: "act-1", name: "618 大促推送", startDate: "2026-06-18", endDate: "2026-06-20", targetAudience: "近30天活跃用户", channels: ["Push", "短信"], content: "限时折扣，全场8折", status: "upcoming", participants: 0, clickRate: 0, conversionRate: 0, createdAt: "2026-05-28" },
  { id: "act-2", name: "新用户引导活动", startDate: "2026-05-20", endDate: "2026-06-20", targetAudience: "注册7天内新用户", channels: ["Push", "站内信"], content: "完成新手任务领红包", status: "active", participants: 1250, clickRate: 0.32, conversionRate: 0.18, createdAt: "2026-05-15" },
  { id: "act-3", name: "五一打卡活动", startDate: "2026-05-01", endDate: "2026-05-05", targetAudience: "全量用户", channels: ["Push"], content: "每日打卡赢好礼", status: "ended", participants: 8900, clickRate: 0.45, conversionRate: 0.22, createdAt: "2026-04-25" },
];

export function getActivities(): StoredActivity[] {
  return getItem<StoredActivity[]>("activities", DEFAULT_ACTIVITIES);
}
export function setActivities(activities: StoredActivity[]) { setItem("activities", activities); }
export function addActivity(a: Omit<StoredActivity, "id" | "createdAt" | "status" | "participants" | "clickRate" | "conversionRate">) {
  const activities = getActivities();
  const now = new Date();
  const start = new Date(a.startDate);
  const end = new Date(a.endDate);
  const status: StoredActivity["status"] = now < start ? "upcoming" : now > end ? "ended" : "active";
  const entry: StoredActivity = { ...a, id: `act-${Date.now()}`, status, participants: 0, clickRate: 0, conversionRate: 0, createdAt: new Date().toISOString().slice(0, 10) };
  activities.unshift(entry);
  setActivities(activities);
  return entry;
}
export function updateActivity(id: string, updates: Partial<StoredActivity>) {
  const activities = getActivities();
  const idx = activities.findIndex((a) => a.id === id);
  if (idx >= 0) activities[idx] = { ...activities[idx], ...updates };
  setActivities(activities);
}
export function deleteActivity(id: string) {
  setActivities(getActivities().filter((a) => a.id !== id));
}

// ── Activity Templates ──

export interface StoredActivityTemplate {
  id: string;
  name: string;
  targetAudience: string;
  channels: string[];
  content: string;
  createdAt: string;
}

export function getActivityTemplates(): StoredActivityTemplate[] {
  return getItem<StoredActivityTemplate[]>("activityTemplates", []);
}
export function addActivityTemplate(t: Omit<StoredActivityTemplate, "id" | "createdAt">) {
  const templates = getActivityTemplates();
  const entry: StoredActivityTemplate = { ...t, id: `tmpl-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
  templates.unshift(entry);
  setItem("activityTemplates", templates);
  return entry;
}
export function deleteActivityTemplate(id: string) {
  setItem("activityTemplates", getActivityTemplates().filter((t) => t.id !== id));
}

// ── Experiments (A/B Tests) ──

export interface StoredExperiment {
  id: string;
  name: string;
  goalMetric: string;
  description: string;
  groupA: string;
  groupB: string;
  trafficSplit: number;
  status: "draft" | "running" | "ended";
  startDate: string;
  plannedDays: number;
  endDate?: string;
  sampleA: number;
  sampleB: number;
  valueA: number;
  valueB: number;
  lift: number;
  confidence: number;
  conclusion: string;
  createdAt: string;
}

const DEFAULT_EXPERIMENTS: StoredExperiment[] = [
  { id: "exp-1", name: "首页按钮颜色测试", goalMetric: "点击率", description: "测试红色按钮 vs 蓝色按钮对点击率的影响", groupA: "蓝色按钮（对照）", groupB: "红色按钮（实验）", trafficSplit: 50, status: "ended", startDate: "2026-05-15", plannedDays: 7, endDate: "2026-05-22", sampleA: 5000, sampleB: 5000, valueA: 0.12, valueB: 0.148, lift: 0.233, confidence: 0.95, conclusion: "红色按钮点击率显著提升23.3%，建议采用", createdAt: "2026-05-14" },
];

export function getExperiments(): StoredExperiment[] {
  return getItem<StoredExperiment[]>("experiments", DEFAULT_EXPERIMENTS);
}
export function setExperiments(exps: StoredExperiment[]) { setItem("experiments", exps); }
export function addExperiment(e: Omit<StoredExperiment, "id" | "createdAt" | "status" | "sampleA" | "sampleB" | "valueA" | "valueB" | "lift" | "confidence" | "conclusion" | "endDate">) {
  const exps = getExperiments();
  const entry: StoredExperiment = { ...e, id: `exp-${Date.now()}`, status: "draft", sampleA: 0, sampleB: 0, valueA: 0, valueB: 0, lift: 0, confidence: 0, conclusion: "", createdAt: new Date().toISOString().slice(0, 10) };
  exps.unshift(entry);
  setExperiments(exps);
  return entry;
}
export function updateExperiment(id: string, updates: Partial<StoredExperiment>) {
  const exps = getExperiments();
  const idx = exps.findIndex((e) => e.id === id);
  if (idx >= 0) exps[idx] = { ...exps[idx], ...updates };
  setExperiments(exps);
}
export function deleteExperiment(id: string) {
  setExperiments(getExperiments().filter((e) => e.id !== id));
}

// ── Team Members ──

export interface StoredMember {
  id: string;
  name: string;
  role: "admin" | "member" | "viewer";
  email: string;
  status: "active" | "pending";
  joinedAt: string;
}

const DEFAULT_MEMBERS: StoredMember[] = [
  { id: "mem-1", name: "Alex", role: "admin", email: "alex@example.com", status: "active", joinedAt: "2026-01-15" },
  { id: "mem-2", name: "小明", role: "member", email: "xiaoming@example.com", status: "active", joinedAt: "2026-02-20" },
  { id: "mem-3", name: "小红", role: "member", email: "xiaohong@example.com", status: "active", joinedAt: "2026-03-10" },
  { id: "mem-4", name: "小王", role: "viewer", email: "xiaowang@example.com", status: "pending", joinedAt: "2026-05-28" },
];

export function getMembers(): StoredMember[] {
  return getItem<StoredMember[]>("members", DEFAULT_MEMBERS);
}
export function setMembers(members: StoredMember[]) { setItem("members", members); }
export function addMember(m: Omit<StoredMember, "id" | "joinedAt">) {
  const members = getMembers();
  const entry: StoredMember = { ...m, id: `mem-${Date.now()}`, joinedAt: new Date().toISOString().slice(0, 10) };
  members.push(entry);
  setMembers(members);
  return entry;
}
export function updateMember(id: string, updates: Partial<StoredMember>) {
  const members = getMembers();
  const idx = members.findIndex((m) => m.id === id);
  if (idx >= 0) members[idx] = { ...members[idx], ...updates };
  setMembers(members);
}
export function removeMember(id: string) {
  setMembers(getMembers().filter((m) => m.id !== id));
}

// ── Comments ──

export interface StoredComment {
  id: string;
  requirementId: string;
  author: string;
  text: string;
  mentions: string[];
  createdAt: string;
}

export function getComments(requirementId?: string): StoredComment[] {
  const all = getItem<StoredComment[]>("comments", []);
  return requirementId ? all.filter((c) => c.requirementId === requirementId) : all;
}
export function addComment(c: Omit<StoredComment, "id" | "createdAt">) {
  const comments = getItem<StoredComment[]>("comments", []);
  const entry: StoredComment = { ...c, id: `cmt-${Date.now()}`, createdAt: new Date().toISOString() };
  comments.push(entry);
  setItem("comments", comments);
  return entry;
}
export function deleteComment(id: string) {
  setItem("comments", getItem<StoredComment[]>("comments", []).filter((c) => c.id !== id));
}

// ── Operation Logs ──

export interface StoredLog {
  id: string;
  operator: string;
  type: string;
  target: string;
  detail: string;
  createdAt: string;
}

export function getLogs(): StoredLog[] {
  return getItem<StoredLog[]>("operationLogs", []);
}
export function addLog(type: string, target: string, detail: string, operator?: string) {
  const logs = getLogs();
  const entry: StoredLog = {
    id: `log-${Date.now()}`,
    operator: operator || getSettings().userName || "未知用户",
    type, target, detail,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(entry);
  if (logs.length > 200) logs.length = 200;
  setItem("operationLogs", logs);
  return entry;
}
export function clearLogs() {
  setItem("operationLogs", []);
}

// ── Current User Role ──

export function getCurrentUserRole(): "admin" | "member" | "viewer" {
  return getItem<"admin" | "member" | "viewer">("currentUserRole", "admin");
}
export function setCurrentUserRole(role: "admin" | "member" | "viewer") {
  setItem("currentUserRole", role);
}
