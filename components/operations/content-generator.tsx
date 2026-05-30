"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Heart, BarChart3, Gamepad2, Copy, Check, Megaphone } from "lucide-react";
import { getUserApiKey, addContent } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

interface CopyVariant {
  id: string;
  style: "emotional" | "data" | "gamified";
  title: string;
  body: string;
  cta: string;
  icon: typeof Heart;
  color: string;
  label: string;
}

const styleMeta = {
  emotional: { icon: Heart, color: "text-rose-500", bg: "bg-rose-50", label: "情感向" },
  data: { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-50", label: "数据向" },
  gamified: { icon: Gamepad2, color: "text-purple-500", bg: "bg-purple-50", label: "游戏化" },
};

function generateMockCopy(targetUsers: string, purpose: string): CopyVariant[] {
  const userLabel = targetUsers || "用户";
  const purposeLabel = purpose || "提升活跃度";

  return [
    {
      id: "v1",
      style: "emotional",
      title: `致每一位${userLabel}：我们听到了你的声音`,
      body: `有时一个微小的改变，就能让体验焕然一新。\n\n这次更新，我们把${purposeLabel}这件事，变得更简单、更贴心。\n\n不是大改，是那些你提到过的、在意的小细节。\n\n打开看看，告诉我们你的感受。`,
      cta: "去看看新变化 →",
      icon: Heart,
      color: "border-rose-200 bg-rose-50/30",
      label: "情感向",
    },
    {
      id: "v2",
      style: "data",
      title: `${purposeLabel}效率提升 40%：数据告诉你为什么该试试`,
      body: `📊 已有 12,000+ ${userLabel}在使用的功能\n⏱ 平均节省 15 分钟 / 次\n⭐ 满意度评分 4.8/5.0\n\n我们做了 3 个关键改进：\n1. 流程简化 —— 从 5 步到 2 步\n2. 智能推荐 —— 基于你的使用习惯\n3. 一键复用 —— 历史记录快速调用`,
      cta: "查看数据详情 →",
      icon: BarChart3,
      color: "border-blue-200 bg-blue-50/30",
      label: "数据向",
    },
    {
      id: "v3",
      style: "gamified",
      title: `🎯 挑战：成为${purposeLabel}高手`,
      body: `恭喜！你已解锁「${purposeLabel}」新成就\n\n🏆 本周任务：\n□ 体验新功能（+10 经验值）\n□ 完成首次配置（+30 经验值）\n□ 邀请一位同事使用（+50 经验值）\n\n完成全部任务可获得专属徽章 + 7 天 VIP 体验`,
      cta: "接受挑战 →",
      icon: Gamepad2,
      color: "border-purple-200 bg-purple-50/30",
      label: "游戏化",
    },
  ];
}

export function ContentGenerator({ initialPersona = "", initialSegment = "" }: { initialPersona?: string; initialSegment?: string }) {
  const [targetUsers, setTargetUsers] = useState(initialSegment || "");
  const [purpose, setPurpose] = useState("");
  const [style, setStyle] = useState<string>("all");
  const [variants, setVariants] = useState<CopyVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  const handleGenerate = async () => {
    if (!purpose.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setIsDemoData(false);
    try {
      const res = await fetch("/api/push-copy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '', targetUsers: targetUsers.trim(), purpose: purpose.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.variants?.length) {
          const mapped: CopyVariant[] = data.variants.map((v: Record<string, string>, i: number) => ({
            id: `v${i + 1}`,
            style: v.style as "emotional" | "data" | "gamified",
            title: v.title,
            body: v.body,
            cta: v.cta,
            icon: styleMeta[v.style as keyof typeof styleMeta]?.icon || Heart,
            color: v.style === "emotional" ? "border-rose-200 bg-rose-50/30" : v.style === "data" ? "border-blue-200 bg-blue-50/30" : "border-purple-200 bg-purple-50/30",
            label: styleMeta[v.style as keyof typeof styleMeta]?.label || "文案",
          }));
          setVariants(mapped);
          setSelectedId(null);
          setEditText("");
          setIsGenerating(false);
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || `请求失败 (${res.status})`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "生成失败，请检查 API 配置";
      setError(msg);
    }
    setIsGenerating(false);
  };

  const handleUseDemo = () => {
    const generated = generateMockCopy(targetUsers, purpose);
    setVariants(generated);
    setSelectedId(null);
    setEditText("");
    setIsDemoData(true);
    setError(null);
  };

  const handleCopy = async (variant: CopyVariant) => {
    const text = `${variant.title}\n\n${variant.body}\n\n${variant.cta}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(variant.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToLibrary = (variant: CopyVariant) => {
    addContent({
      title: variant.title,
      content: `${variant.title}\n\n${variant.body}\n\n${variant.cta}`,
      style: variant.label,
      segment: targetUsers,
      purpose,
    });
    showToast("已保存到素材库", "success");
  };

  const filtered = style === "all" ? variants : variants.filter((v) => v.style === style);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Input Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">AI 推送文案生成</h3>
        </div>

        {initialPersona && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-sm text-amber-700">
            来自用户画像「{initialPersona}」{initialSegment && `（${initialSegment}）`}，已预填目标用户群。
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">目标用户群</label>
            <Input
              placeholder="如：重度用户、流失风险用户..."
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">推送目的 *</label>
            <Input
              placeholder="如：召回流失用户、推广新功能、提升付费转化..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!purpose.trim() || isGenerating}
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />生成文案</>
            )}
          </Button>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
              <div className="text-sm text-red-700 flex-1">
                <p className="font-medium mb-1">AI 生成失败</p>
                <p className="text-red-600 text-xs">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUseDemo}
                className="rounded-lg border-red-200 text-red-600 hover:bg-red-100 text-xs shrink-0"
              >
                使用演示数据
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Style Filter & Variants */}
      {variants.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400">文案风格:</span>
            {isDemoData && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>
            )}
            <div className="flex gap-1 bg-gray-100/60 p-0.5 rounded-lg">
              {[
                { key: "all", label: "全部" },
                { key: "emotional", label: "情感向" },
                { key: "data", label: "数据向" },
                { key: "gamified", label: "游戏化" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyle(s.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    style === s.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filtered.map((variant) => {
              const meta = styleMeta[variant.style];
              const Icon = meta.icon;
              const isSelected = selectedId === variant.id;

              return (
                <div
                  key={variant.id}
                  className={`rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${
                    isSelected ? "ring-2 ring-gray-300 border-gray-300" : "border-gray-100"
                  } ${variant.color}`}
                >
                  {/* Style Badge */}
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 ${meta.bg} rounded-lg px-2.5 py-1`}>
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(variant)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedId === variant.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-5 pb-5">
                    <h4 className="font-bold text-gray-900 mb-3 text-[15px] leading-snug">{variant.title}</h4>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                      {variant.body}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{variant.cta}</div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-gray-200 text-xs flex-1"
                      onClick={() => {
                        setSelectedId(isSelected ? null : variant.id);
                        setEditText(isSelected ? "" : `${variant.title}\n\n${variant.body}\n\n${variant.cta}`);
                      }}
                    >
                      {isSelected ? "取消编辑" : "编辑"}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs flex-1"
                      onClick={() => handleCopy(variant)}
                    >
                      {copiedId === variant.id ? "已复制" : "选用"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-gray-200 text-xs"
                      onClick={() => handleSaveToLibrary(variant)}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit Area */}
          {selectedId && editText && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm max-w-2xl">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">编辑文案</h3>
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={10}
                className="rounded-xl border-gray-200 font-sans"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(editText);
                    setCopiedId("edited");
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                >
                  {copiedId === "edited" ? <><Check className="mr-1.5 w-3.5 h-3.5" />已复制</> : <><Copy className="mr-1.5 w-3.5 h-3.5" />复制</>}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {variants.length === 0 && !isGenerating && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center max-w-2xl">
          <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">填写推送目的，AI 生成多风格文案</p>
          <p className="text-gray-400 text-xs">同时生成情感向、数据向、游戏化三种风格，支持编辑和复制</p>
        </div>
      )}
    </div>
  );
}
