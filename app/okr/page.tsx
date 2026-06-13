"use client";

import { useState, useEffect } from "react";
import { StoredObjective, StoredKeyResult, getObjectives, addObjective, updateObjective, deleteObjective } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { Target, Plus, X, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export default function OkrPage() {
  const [objectives, setObjectives] = useState<StoredObjective[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", quarter: "2026 Q2", owner: "", keyResults: [{ text: "", current: 0, target: 100, unit: "%" }] });

  const refresh = () => setObjectives(getObjectives());

  useEffect(() => {
    refresh();
    setLoaded(true);
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleCreate = () => {
    if (!form.title.trim()) return;
    const krs: StoredKeyResult[] = form.keyResults.filter(k => k.text.trim()).map((k, i) => ({
      id: `kr-new-${Date.now()}-${i}`,
      text: k.text.trim(),
      current: k.current,
      target: k.target,
      unit: k.unit,
      status: "on_track" as const,
    }));
    addObjective({ title: form.title.trim(), description: form.description.trim(), quarter: form.quarter, status: "active", owner: form.owner.trim() || "未分配", keyResults: krs });
    showToast("目标已创建", "success");
    setCreateOpen(false);
    setForm({ title: "", description: "", quarter: "2026 Q2", owner: "", keyResults: [{ text: "", current: 0, target: 100, unit: "%" }] });
    refresh();
  };

  const updateKR = (objId: string, krId: string, updates: Partial<StoredKeyResult>) => {
    const obj = objectives.find(o => o.id === objId);
    if (!obj) return;
    const krs = obj.keyResults.map(kr => kr.id === krId ? { ...kr, ...updates } : kr);
    updateObjective(objId, { keyResults: krs });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm("确定删除该目标吗？")) return;
    deleteObjective(id);
    showToast("目标已删除", "success");
    refresh();
  };

  if (!loaded) return null;

  return (
    <div className="max-w-[960px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">OKR 目标管理</h1>
            <p className="text-sm text-gray-400 mt-0.5">{objectives.length} 个目标</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
          <Plus className="w-4 h-4" />新建目标
        </button>
      </div>

      {objectives.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">还没有目标，创建你的第一个 OKR</p>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((obj) => (
            <div key={obj.id} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <button onClick={() => toggleExpand(obj.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {expanded.has(obj.id) ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{obj.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${obj.status === "active" ? "bg-emerald-100 text-emerald-700" : obj.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {obj.status === "active" ? "进行中" : obj.status === "completed" ? "已完成" : "已取消"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{obj.quarter}</span>
                    <span>{obj.owner}</span>
                    <span>{obj.keyResults.length} 个 KR</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{obj.progress}%</div>
                  <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mt-1 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${obj.progress >= 70 ? "bg-emerald-500" : obj.progress >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${obj.progress}%` }} />
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(obj.id); }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>

              {expanded.has(obj.id) && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 animate-fade-in">
                  {obj.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{obj.description}</p>}
                  <div className="space-y-3">
                    {obj.keyResults.map((kr) => (
                      <div key={kr.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${kr.status === "on_track" ? "bg-emerald-500" : kr.status === "at_risk" ? "bg-amber-500" : "bg-red-500"}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0">{kr.text}</span>
                        <input
                          type="number"
                          value={kr.current}
                          onChange={(e) => updateKR(obj.id, kr.id, { current: Number(e.target.value) })}
                          className="w-16 text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-sm font-medium tabular-nums"
                        />
                        <span className="text-xs text-gray-400 w-8 text-right">/ {kr.target}</span>
                        <span className="text-[10px] text-gray-400 w-6">{kr.unit}</span>
                        <span className={`text-[10px] font-semibold ${kr.current >= kr.target ? "text-emerald-600" : kr.current / kr.target >= 0.7 ? "text-amber-600" : "text-red-600"}`}>
                          {Math.round((kr.current / kr.target) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setCreateOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">新建目标</h3>
              <button onClick={() => setCreateOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <input placeholder="目标标题 *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100" autoFocus />
              <textarea placeholder="目标描述（可选）" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="负责人" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100" />
                <select value={form.quarter} onChange={e => setForm({ ...form, quarter: e.target.value })} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100">
                  <option value="2026 Q1">2026 Q1</option>
                  <option value="2026 Q2">2026 Q2</option>
                  <option value="2026 Q3">2026 Q3</option>
                  <option value="2026 Q4">2026 Q4</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">关键结果 (KR)</label>
                <div className="space-y-2">
                  {form.keyResults.map((kr, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input placeholder={`KR ${i + 1}`} value={kr.text} onChange={e => { const krs = [...form.keyResults]; krs[i] = { ...krs[i], text: e.target.value }; setForm({ ...form, keyResults: krs }); }} className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100" />
                      <input type="number" value={kr.current} onChange={e => { const krs = [...form.keyResults]; krs[i] = { ...krs[i], current: Number(e.target.value) }; setForm({ ...form, keyResults: krs }); }} className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-2 text-sm text-center dark:bg-gray-800 dark:text-gray-100" />
                      <span className="text-xs text-gray-400">/</span>
                      <input type="number" value={kr.target} onChange={e => { const krs = [...form.keyResults]; krs[i] = { ...krs[i], target: Number(e.target.value) }; setForm({ ...form, keyResults: krs }); }} className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-2 text-sm text-center dark:bg-gray-800 dark:text-gray-100" />
                      <input placeholder="单位" value={kr.unit} onChange={e => { const krs = [...form.keyResults]; krs[i] = { ...krs[i], unit: e.target.value }; setForm({ ...form, keyResults: krs }); }} className="w-12 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-2 text-sm dark:bg-gray-800 dark:text-gray-100" />
                      {form.keyResults.length > 1 && (
                        <button onClick={() => setForm({ ...form, keyResults: form.keyResults.filter((_, idx) => idx !== i) })} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, keyResults: [...form.keyResults, { text: "", current: 0, target: 100, unit: "%" }] })} className="text-xs text-violet-600 hover:text-violet-800 font-medium">+ 添加 KR</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} disabled={!form.title.trim()} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50">创建</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
