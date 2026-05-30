"use client";

import { useState } from "react";
import { mockPersonas, mockSegments, UserPersona } from "@/lib/mock/user-data";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Target, AlertCircle, Lightbulb, Quote, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { getUserApiKey } from "@/lib/store/local-store";

function PersonaCard({ persona }: { persona: UserPersona }) {
  const segment = mockSegments.find((s) => s.name === persona.segmentName);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm"
            style={{ backgroundColor: segment?.color || "#6366F1" }}
          >
            {persona.name[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-gray-900 text-lg">{persona.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${segment?.color}15`, color: segment?.color }}
              >
                {persona.segmentName}
              </span>
            </div>
            <p className="text-sm text-gray-500">{persona.age}岁 · {persona.occupation}</p>
            <p className="text-sm text-gray-600 mt-1.5 italic">&ldquo;{persona.tagline}&rdquo;</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Quote */}
        <div className="rounded-xl bg-gray-50 p-3 flex items-start gap-2.5">
          <Quote className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;{persona.quote}&rdquo;</p>
        </div>

        {/* Goals & Pain Points */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">目标</span>
            </div>
            <ul className="space-y-1.5">
              {persona.goals.map((g, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">痛点</span>
            </div>
            <ul className="space-y-1.5">
              {persona.painPoints.map((p, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Behaviors */}
        <div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">行为特征</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {persona.behaviors.map((b, i) => (
              <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/operations?persona=${encodeURIComponent(persona.name)}&segment=${encodeURIComponent(persona.segmentName)}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            生成推送文案
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PersonaGenerator() {
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [showGenerated, setShowGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  const filtered = selectedSegment === "all"
    ? personas
    : personas.filter((p) => p.segmentName === selectedSegment);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowGenerated(false);
    setError(null);
    setIsDemoData(false);
    try {
      const seg = mockSegments.find((s) => s.name === selectedSegment) || mockSegments[0];
      const res = await fetch("/api/persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '',
          segmentName: seg.name,
          segmentDesc: seg.strategy,
          characteristics: seg.characteristics,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.personas?.length) {
          const mapped: UserPersona[] = data.personas.map((p: Record<string, unknown>) => ({
            name: p.name as string,
            age: p.age as number,
            occupation: p.occupation as string,
            tagline: p.tagline as string,
            quote: p.quote as string,
            goals: p.goals as string[],
            painPoints: p.painPoints as string[],
            behaviors: p.behaviors as string[],
            segmentName: seg.name,
          }));
          setPersonas(mapped);
          setShowGenerated(true);
          setIsGenerating(false);
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || `请求失败 (${res.status})`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "生成失败，请检查 API 配置");
    }
    setIsGenerating(false);
  };

  const handleUseDemo = () => {
    setPersonas(mockPersonas.filter(p => selectedSegment === "all" || p.segmentName === selectedSegment));
    setShowGenerated(true);
    setIsDemoData(true);
    setError(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-sm text-gray-900">AI 用户画像生成</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          基于用户分层数据，AI 自动生成典型用户画像，包含目标、痛点、行为特征和运营建议。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedSegment} onValueChange={(v) => v && setSelectedSegment(v)}>
            <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
              <SelectValue placeholder="选择分群" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分群</SelectItem>
              {mockSegments.map((s) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />{showGenerated ? "重新生成" : "生成画像"}</>
            )}
          </Button>
        </div>
        {showGenerated && !error && (
          <div className={`mt-3 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 ${
            isDemoData
              ? "bg-amber-50 border border-amber-100 text-amber-700"
              : "bg-emerald-50 border border-emerald-100 text-emerald-700"
          }`}>
            <Lightbulb className="w-4 h-4 shrink-0" />
            {isDemoData
              ? `当前为演示数据，显示 ${filtered.length} 个示例画像`
              : `AI 已基于用户分群数据生成了 ${filtered.length} 个画像`
            }
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
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

      {/* Persona Cards */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((persona) => (
            <PersonaCard key={persona.name} persona={persona} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && !isGenerating && !error && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center max-w-2xl">
          <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">选择用户分群，点击生成按钮</p>
          <p className="text-gray-400 text-xs">AI 将基于分群特征自动生成典型用户画像</p>
        </div>
      )}
    </div>
  );
}
