"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, X, Sparkles, Loader2, Trash2, Megaphone, Clock, TrendingUp, Copy, Users, Tag } from "lucide-react";
import { getUserApiKey } from "@/lib/store/local-store";
import {
  getActivities, addActivity, updateActivity, deleteActivity,
  getActivityTemplates, addActivityTemplate, deleteActivityTemplate,
  StoredActivity, StoredActivityTemplate,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

interface ActivityPlan {
  name: string;
  theme: string;
  mechanics: string;
  timeline: { phase: string; dateRange: string; actions: string[] }[];
  budgetBreakdown: { item: string; cost: number; note: string }[];
  risks: { risk: string; probability: string; impact: string; mitigation: string }[];
  expectedMetrics: { participants: string; conversionRate: string; roi: string };
  copySuggestions: { channel: string; title: string; body: string }[];
  channels: string[];
  targetAudience: string;
}

const statusMeta: Record<string, { label: string; color: string }> = {
  upcoming: { label: "即将开始", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  active: { label: "进行中", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ended: { label: "已结束", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const channelOptions = ["Push", "短信", "站内信", "邮件", "公众号", "App弹窗", "社群"];

function getDemoPlan(): ActivityPlan {
  return {
    name: "618 会员日狂欢",
    theme: "买一年送一季 · 限时升级",
    mechanics: "活动期间购买年度会员自动赠送3个月，前1000名额外赠送周边礼盒。设置阶梯奖励：单笔满200减30、满500减100。分享活动页给好友可得10元优惠券。",
    timeline: [
      { phase: "预热期", dateRange: "6.10 - 6.15", actions: ["发布预告Push", "KOL社媒种草", "预约有礼页面上线", "客服话术培训"] },
      { phase: "爆发期", dateRange: "6.16 - 6.18", actions: ["0点准时开抢Push", "每小时战报推送", "限量周边下单提醒", "社群实时答疑"] },
      { phase: "返场期", dateRange: "6.19 - 6.20", actions: ["未付款用户召回", "爆款补货通知", "活动战报总结"] },
    ],
    budgetBreakdown: [
      { item: "优惠券补贴", cost: 50000, note: "满200减30、满500减100" },
      { item: "周边礼品", cost: 15000, note: "定制礼盒×1000份" },
      { item: "Push推送", cost: 3000, note: "全量用户3次推送" },
      { item: "KOL合作", cost: 20000, note: "3位腰部KOL" },
    ],
    risks: [
      { risk: "服务器并发压力", probability: "中", impact: "页面加载慢导致用户流失", mitigation: "提前压测，准备降级方案" },
      { risk: "羊毛党刷单", probability: "高", impact: "营销费用被薅走", mitigation: "设置风控规则，限制新用户优惠额度" },
      { risk: "竞品同期大促", probability: "中", impact: "用户被分流", mitigation: "提前锁定用户预约，设置差异化权益" },
    ],
    expectedMetrics: { participants: "15,000 - 20,000", conversionRate: "8% - 12%", roi: "1 : 2.5" },
    copySuggestions: [
      { channel: "Push", title: "618会员狂欢 · 买一年送一季", body: "限时48小时！年度会员加赠3个月，前1000名送限定周边。点击锁定名额 →" },
      { channel: "短信", title: "【Pulse】你的会员专属福利待领取", body: "618会员日，买一年送一季，再领200元礼包。限今日有效：t.cn/xxx 退订回T" },
    ],
    channels: ["Push", "短信", "站内信", "社群"],
    targetAudience: "近90天活跃用户 + 会员到期30天内用户",
  };
}

export function ActivityManager() {
  const [activities, setActivities] = useState<StoredActivity[]>([]);
  const [templates, setTemplates] = useState<StoredActivityTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", startDate: "", endDate: "", targetAudience: "", channels: [] as string[], content: "",
  });

  // AI Generate
  const [genOpen, setGenOpen] = useState(false);
  const [genGoal, setGenGoal] = useState("");
  const [genTarget, setGenTarget] = useState("");
  const [genBudget, setGenBudget] = useState("");
  const [genChannels, setGenChannels] = useState("");
  const [genDuration, setGenDuration] = useState("7天");
  const [genResult, setGenResult] = useState<ActivityPlan | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isDemoPlan, setIsDemoPlan] = useState(false);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAct, setSelectedAct] = useState<StoredActivity | null>(null);
  const [drawerForm, setDrawerForm] = useState<StoredActivity | null>(null);
  const refresh = () => {
    setActivities(getActivities());
    setTemplates(getActivityTemplates());
  };

  useEffect(() => { refresh(); setLoaded(true); }, []);

  const handleCreate = () => {
    if (!createForm.name.trim()) return;
    addActivity({ ...createForm, channels: createForm.channels });
    showToast("活动已创建", "success");
    setCreateOpen(false);
    setCreateForm({ name: "", startDate: "", endDate: "", targetAudience: "", channels: [], content: "" });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteActivity(id);
    showToast("已删除", "success");
    setDrawerOpen(false);
    refresh();
  };

  const handleSaveDrawer = () => {
    if (!drawerForm || !selectedAct) return;
    updateActivity(selectedAct.id, drawerForm);
    showToast("保存成功", "success");
    setDrawerOpen(false);
    refresh();
  };

  const handleGenerate = async () => {
    if (!genGoal.trim()) return;
    setGenLoading(true);
    setGenError(null);
    setIsDemoPlan(false);
    try {
      const res = await fetch("/api/activity/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: getUserApiKey(),
          goal: genGoal.trim(),
          targetAudience: genTarget.trim(),
          budget: genBudget.trim(),
          channels: genChannels.trim(),
          duration: genDuration,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.plan) { setGenResult(data.plan); setGenLoading(false); return; }
      }
      throw new Error("AI 生成失败");
    } catch {
      setGenError("生成失败，请检查 API Key 配置");
    }
    setGenLoading(false);
  };

  const handleUseDemo = () => {
    setGenResult(getDemoPlan());
    setIsDemoPlan(true);
    setGenError(null);
  };

  const handleAdoptPlan = () => {
    if (!genResult) return;
    setCreateForm({
      name: genResult.name,
      startDate: "",
      endDate: "",
      targetAudience: genResult.targetAudience,
      channels: genResult.channels,
      content: `主题：${genResult.theme}\n\n玩法：${genResult.mechanics}\n\n时间节奏：\n${genResult.timeline.map(t => `【${t.phase}】${t.dateRange}\n${t.actions.map(a => `  - ${a}`).join("\n")}`).join("\n")}\n\n预算：\n${genResult.budgetBreakdown.map(b => `  - ${b.item}: ¥${b.cost.toLocaleString()} (${b.note})`).join("\n")}`,
    });
    setGenOpen(false);
    setCreateOpen(true);
    setGenResult(null);
  };

  const handleSaveAsTemplate = (act: StoredActivity) => {
    addActivityTemplate({ name: act.name, targetAudience: act.targetAudience, channels: act.channels, content: act.content });
    showToast("已保存为模板", "success");
    refresh();
  };

  const handleUseTemplate = (tpl: StoredActivityTemplate) => {
    setCreateForm({
      name: tpl.name,
      startDate: "",
      endDate: "",
      targetAudience: tpl.targetAudience,
      channels: tpl.channels,
      content: tpl.content,
    });
    setCreateOpen(true);
  };

  const inputCls = "w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-colors";

  if (!loaded) return null;

  const upcoming = activities.filter(a => a.status === "upcoming");
  const active = activities.filter(a => a.status === "active");

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Megaphone className="w-4 h-4" />
          <span>共 {activities.length} 个活动</span>
          {active.length > 0 && <span className="text-emerald-600">· {active.length} 个进行中</span>}
          {upcoming.length > 0 && <span className="text-blue-600">· {upcoming.length} 个即将开始</span>}
        </div>
        <button
          onClick={() => setGenOpen(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-2 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
        >
          <Sparkles className="w-4 h-4" />AI 生成方案
        </button>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />新建活动
        </button>
      </div>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center">
          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">暂无活动</p>
          <p className="text-gray-400 text-xs">使用 AI 生成活动方案，或手动创建新活动</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activities.map((act) => (
            <div
              key={act.id}
              onClick={() => { setSelectedAct(act); setDrawerForm({ ...act }); setDrawerOpen(true); }}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{act.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {act.startDate} ~ {act.endDate}
                    </div>
                  </div>
                  <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusMeta[act.status]?.color}`}>
                    {statusMeta[act.status]?.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{act.targetAudience || "全量用户"}</span>
                  {act.status !== "upcoming" && (
                    <>
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />参与 {act.participants.toLocaleString()}</span>
                      <span className="flex items-center gap-1">点击率 {(act.clickRate * 100).toFixed(1)}%</span>
                    </>
                  )}
                </div>
                {act.channels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {act.channels.map((ch) => (
                      <span key={ch} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{ch}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template library */}
      {templates.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">活动模板 ({templates.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800/50">
                <button onClick={() => handleUseTemplate(tpl)} className="text-sm text-gray-700 dark:text-gray-300 hover:text-amber-600 transition-colors">
                  {tpl.name}
                </button>
                <button onClick={() => { deleteActivityTemplate(tpl.id); refresh(); }} className="text-gray-400 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {genOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60" onClick={() => { setGenOpen(false); setGenResult(null); setGenError(null); }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI 活动方案生成</h3>
              </div>
              <button onClick={() => { setGenOpen(false); setGenResult(null); setGenError(null); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {!genResult ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">活动目标 *</label>
                  <input placeholder="如：提升会员续费率、新品推广、用户召回..." value={genGoal} onChange={(e) => setGenGoal(e.target.value)} className={inputCls} autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">目标用户</label>
                    <input placeholder="如：近90天活跃用户" value={genTarget} onChange={(e) => setGenTarget(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">预算范围</label>
                    <input placeholder="如：5-10万" value={genBudget} onChange={(e) => setGenBudget(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">可用渠道</label>
                    <input placeholder="如：Push、短信、社群" value={genChannels} onChange={(e) => setGenChannels(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">活动时长</label>
                    <select value={genDuration} onChange={(e) => setGenDuration(e.target.value)} className={inputCls}>
                      <option value="3天">3天（快闪）</option>
                      <option value="7天">7天（标准）</option>
                      <option value="14天">14天（大促）</option>
                      <option value="30天">30天（月度）</option>
                    </select>
                  </div>
                </div>
                {genError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
                    <div className="text-sm text-red-700 flex-1">
                      <p className="font-medium mb-1">AI 生成失败</p>
                      <p className="text-red-600 text-xs">{genError}</p>
                    </div>
                    <button onClick={handleUseDemo} className="rounded-lg border border-red-200 text-red-600 hover:bg-red-100 text-xs px-3 py-1.5 shrink-0">使用演示数据</button>
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={!genGoal.trim() || genLoading}
                  className="w-full rounded-lg bg-gray-900 hover:bg-gray-800 text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {genLoading ? <><Loader2 className="w-4 h-4 animate-spin" />生成中...</> : <><Sparkles className="w-4 h-4" />生成活动方案</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {isDemoPlan && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{genResult.name}</h4>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{genResult.theme}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">活动玩法</h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{genResult.mechanics}</p>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">时间节奏</h5>
                  <div className="space-y-2">
                    {genResult.timeline.map((t, i) => (
                      <div key={i} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{t.phase}</span>
                          <span className="text-[10px] text-gray-400">{t.dateRange}</span>
                        </div>
                        <ul className="space-y-0.5">
                          {t.actions.map((a, j) => <li key={j} className="text-xs text-gray-600 dark:text-gray-400 pl-3">· {a}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">预算分配</h5>
                    {genResult.budgetBreakdown.map((b, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-600 dark:text-gray-400">{b.item}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">¥{b.cost.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs py-1 font-semibold">
                      <span>合计</span>
                      <span className="text-gray-900 dark:text-gray-100">¥{genResult.budgetBreakdown.reduce((s, b) => s + b.cost, 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">预期指标</h5>
                    <div className="text-xs space-y-1">
                      <p>参与人数: <span className="font-medium">{genResult.expectedMetrics.participants}</span></p>
                      <p>转化率: <span className="font-medium">{genResult.expectedMetrics.conversionRate}</span></p>
                      <p>ROI: <span className="font-medium text-emerald-600">{genResult.expectedMetrics.roi}</span></p>
                    </div>
                    <h5 className="text-xs font-semibold text-gray-400 uppercase mt-3 mb-1">风险提示</h5>
                    {genResult.risks.map((r, i) => (
                      <div key={i} className="text-xs mb-1">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${r.probability === "高" ? "bg-red-500" : r.probability === "中" ? "bg-amber-500" : "bg-gray-400"}`} />
                        <span className="text-gray-700 dark:text-gray-300">{r.risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleAdoptPlan} className="flex-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-white py-2.5 text-sm font-medium transition-colors">采用此方案</button>
                  <button onClick={() => setGenResult(null)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">重新生成</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Activity Modal */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60" onClick={() => setCreateOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">新建活动</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">活动名称 *</label>
                <input placeholder="如：618大促" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">开始日期</label>
                  <input type="date" value={createForm.startDate} onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">结束日期</label>
                  <input type="date" value={createForm.endDate} onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">目标用户</label>
                <input placeholder="如：近30天活跃用户" value={createForm.targetAudience} onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">推送渠道</label>
                <div className="flex flex-wrap gap-2">
                  {channelOptions.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => {
                        const next = createForm.channels.includes(ch) ? createForm.channels.filter(c => c !== ch) : [...createForm.channels, ch];
                        setCreateForm({ ...createForm, channels: next });
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${createForm.channels.includes(ch) ? "bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400" : "border-gray-200 dark:border-gray-700 text-gray-500"}`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">活动内容</label>
                <textarea placeholder="活动描述、玩法、规则..." value={createForm.content} onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })} rows={4} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setCreateOpen(false)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} disabled={!createForm.name.trim()} className="rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50">创建</button>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      {drawerOpen && selectedAct && drawerForm && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="fixed right-0 top-0 h-full z-50 w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">活动详情</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">活动名称</label>
                <input value={drawerForm.name} onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">开始日期</label>
                  <input type="date" value={drawerForm.startDate} onChange={(e) => setDrawerForm({ ...drawerForm, startDate: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">结束日期</label>
                  <input type="date" value={drawerForm.endDate} onChange={(e) => setDrawerForm({ ...drawerForm, endDate: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">状态</label>
                <select value={drawerForm.status} onChange={(e) => setDrawerForm({ ...drawerForm, status: e.target.value as StoredActivity["status"] })} className={inputCls}>
                  {Object.entries(statusMeta).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">目标用户</label>
                <input value={drawerForm.targetAudience} onChange={(e) => setDrawerForm({ ...drawerForm, targetAudience: e.target.value })} className={inputCls} />
              </div>
              {drawerForm.status !== "upcoming" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">参与人数</label>
                    <input type="number" value={drawerForm.participants} onChange={(e) => setDrawerForm({ ...drawerForm, participants: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">点击率</label>
                    <input type="number" step="0.01" min="0" max="1" value={drawerForm.clickRate} onChange={(e) => setDrawerForm({ ...drawerForm, clickRate: parseFloat(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">转化率</label>
                    <input type="number" step="0.01" min="0" max="1" value={drawerForm.conversionRate} onChange={(e) => setDrawerForm({ ...drawerForm, conversionRate: parseFloat(e.target.value) || 0 })} className={inputCls} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">活动内容</label>
                <textarea value={drawerForm.content} onChange={(e) => setDrawerForm({ ...drawerForm, content: e.target.value })} rows={6} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveDrawer} className="flex-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">保存</button>
                <button onClick={() => handleDelete(selectedAct.id)} className="rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => handleSaveAsTemplate(selectedAct)} className="rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors" title="保存为模板"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
