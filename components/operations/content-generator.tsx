"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Briefcase, Heart, Zap, Copy, Check, Megaphone, TrendingUp, Tag, Target } from "lucide-react";
import { getUserApiKey, addContent } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";

interface CopyVariant {
  id: string;
  style: "professional" | "friendly" | "urgent";
  title: string;
  body: string;
  cta: string;
  reasoning: string;
  estimatedOpenRate: string;
  recommendedScenario: string;
  color: string;
  label: string;
}

const styleMeta = {
  professional: { icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", label: "专业", borderColor: "border-blue-200", cardBg: "bg-blue-50/30" },
  friendly: { icon: Heart, color: "text-rose-500", bg: "bg-rose-50", label: "亲切", borderColor: "border-rose-200", cardBg: "bg-rose-50/30" },
  urgent: { icon: Zap, color: "text-amber-600", bg: "bg-amber-50", label: "紧迫", borderColor: "border-amber-200", cardBg: "bg-amber-50/30" },
};

const lengthOptions = [
  { value: "short", label: "极短", desc: "20-30字 · Push/短信" },
  { value: "medium", label: "标准", desc: "50-80字 · 站内信" },
  { value: "long", label: "详细", desc: "120-180字 · 活动页" },
  { value: "full", label: "长文", desc: "300-500字 · 公众号" },
];

const styleOptions = [
  { value: "all", label: "全部风格", desc: "三种风格各生成一个版本" },
  { value: "professional", label: "专业", desc: "正式、数据驱动" },
  { value: "friendly", label: "亲切", desc: "口语化、情感向" },
  { value: "urgent", label: "紧迫", desc: "稀缺性、限时感" },
];

function getDemoCopies(): CopyVariant[] {
  return [
    {
      id: "v1",
      style: "professional",
      title: "Q2 用户活跃度提升方案",
      body: "📊 数据驱动增长：\n\n根据过去 30 天数据分析，核心功能日活有 12% 提升空间。我们建议从 3 个方向入手：新手引导优化、核心功能曝光提升、沉默用户召回。\n\n详细方案已上线，点击查看完整报告。",
      cta: "查看数据 →",
      reasoning: "数据论证充分，适合管理层汇报",
      estimatedOpenRate: "25%",
      recommendedScenario: "站内信、邮件",
      color: "border-blue-200 bg-blue-50/30",
      label: "专业",
    },
    {
      id: "v2",
      style: "friendly",
      title: "我们为你准备了一份小惊喜",
      body: "嘿～\n\n最近收到很多用户反馈，我们花了 2 周时间，把你最常提到的 3 个问题都优化了。\n\n变化不大，但每一点都很贴心。\n\n打开看看，希望能让你省几分钟 ✨",
      cta: "去看看 →",
      reasoning: "口语化表达，建立情感连接",
      estimatedOpenRate: "28%",
      recommendedScenario: "App Push、社群分享",
      color: "border-rose-200 bg-rose-50/30",
      label: "亲切",
    },
    {
      id: "v3",
      style: "urgent",
      title: "⏰ 最后 24 小时：会员权益即将调整",
      body: "重要提醒：\n\n现有会员权益方案将在 24 小时后调整，当前方案中的免费配送和专属客服权益将不再对新会员开放。\n\n现在续费，锁定当前权益方案。错过不再有。",
      cta: "立即续费 →",
      reasoning: "稀缺性+时间压力，驱动即时行动",
      estimatedOpenRate: "32%",
      recommendedScenario: "Push、短信、App 弹窗",
      color: "border-amber-200 bg-amber-50/30",
      label: "紧迫",
    },
  ];
}

export function ContentGenerator({ initialPersona = "", initialSegment = "" }: { initialPersona?: string; initialSegment?: string }) {
  const [targetUsers, setTargetUsers] = useState(initialSegment || "");
  const [purpose, setPurpose] = useState("");
  const [length, setLength] = useState("medium");
  const [aiStyle, setAiStyle] = useState("all");
  const [filterStyle, setFilterStyle] = useState("all");
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
        body: JSON.stringify({
          apiKey: getUserApiKey() || "",
          targetUsers: targetUsers.trim(),
          purpose: purpose.trim(),
          length,
          style: aiStyle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.variants?.length) {
          const mapped: CopyVariant[] = data.variants.map((v: Record<string, string>, i: number) => {
            const s = (v.style as keyof typeof styleMeta) || "professional";
            const meta = styleMeta[s] || styleMeta.professional;
            return {
              id: `v${i + 1}`,
              style: s as "professional" | "friendly" | "urgent",
              title: v.title,
              body: v.body,
              cta: v.cta,
              reasoning: v.reasoning || "",
              estimatedOpenRate: v.estimatedOpenRate || "",
              recommendedScenario: v.recommendedScenario || "",
              color: `${meta.borderColor} ${meta.cardBg}`,
              label: meta.label,
            };
          });
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
    const generated = getDemoCopies();
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

  const filtered = filterStyle === "all" ? variants : variants.filter((v) => v.style === filterStyle);

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

          {/* Length selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">文案长度</label>
            <div className="grid grid-cols-4 gap-2">
              {lengthOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLength(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    length === opt.value
                      ? "border-gray-300 bg-gray-50 ring-1 ring-gray-200"
                      : "border-gray-150 hover:border-gray-200"
                  }`}
                >
                  <div className="text-xs font-medium text-gray-900">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Style selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">文案风格</label>
            <div className="grid grid-cols-4 gap-2">
              {styleOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAiStyle(opt.value)}
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    aiStyle === opt.value
                      ? "border-gray-300 bg-gray-50 ring-1 ring-gray-200"
                      : "border-gray-150 hover:border-gray-200"
                  }`}
                >
                  <div className="text-xs font-medium text-gray-900">{opt.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!purpose.trim() || isGenerating}
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />AI 生成文案</>
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

      {/* Filter & Variants */}
      {variants.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400">筛选:</span>
            {isDemoData && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>
            )}
            <div className="flex gap-1 bg-gray-100/60 p-0.5 rounded-lg">
              {[
                { key: "all", label: "全部" },
                { key: "professional", label: "专业" },
                { key: "friendly", label: "亲切" },
                { key: "urgent", label: "紧迫" },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setFilterStyle(s.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filterStyle === s.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {filtered.map((variant) => {
              const meta = styleMeta[variant.style] || styleMeta.professional;
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
                  <div className="px-5 pb-4">
                    <h4 className="font-bold text-gray-900 mb-2 text-[15px] leading-snug">{variant.title}</h4>
                    <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-3">
                      {variant.body}
                    </div>
                    <div className="inline-block rounded-lg bg-gray-900 text-white text-xs font-medium px-3 py-1">
                      {variant.cta}
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="px-5 pb-3 space-y-1.5">
                    {variant.estimatedOpenRate && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-gray-500">预估打开率</span>
                        <span className="font-semibold text-emerald-600">{variant.estimatedOpenRate}</span>
                      </div>
                    )}
                    {variant.recommendedScenario && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Target className="w-3 h-3 text-blue-500" />
                        <span className="text-gray-500">推荐场景</span>
                        <span className="font-medium text-gray-700">{variant.recommendedScenario}</span>
                      </div>
                    )}
                    {variant.reasoning && (
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <Tag className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-500">{variant.reasoning}</span>
                      </div>
                    )}
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
          <p className="text-gray-500 text-sm mb-2">选择长度和风格，AI 生成精准文案</p>
          <p className="text-gray-400 text-xs">支持极短/标准/详细/长文四种长度，专业/亲切/紧迫三种风格</p>
        </div>
      )}
    </div>
  );
}
