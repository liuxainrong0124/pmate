"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, Clock, Repeat, DollarSign, Target, ChevronDown, ChevronUp, Users } from "lucide-react";
import { getUserApiKey,  getItem, setItem } from "@/lib/store/local-store";

interface Segment {
  name: string;
  percentage: number;
  r: string;
  f: string;
  m: string;
  characteristics: string[];
  strategy: string;
  color: string;
}

interface SegmentationData {
  segments: Segment[];
  totalUsers: number;
}

const DEFAULT_SEGMENTS: SegmentationData = {
  segments: [
    {
      name: "重度用户", percentage: 18, r: "近7天活跃", f: "日均3次+", m: "月均消费 ¥200+",
      characteristics: ["高频使用核心功能", "付费意愿强", "对新产品功能敏感", "社交分享活跃"],
      strategy: "提供VIP专属权益和新功能内测资格，建立用户共创社区，定期1v1触达维护关系",
      color: "#6366F1",
    },
    {
      name: "普通用户", percentage: 45, r: "近14天活跃", f: "日均1-2次", m: "月均消费 ¥30-80",
      characteristics: ["使用核心功能为主", "价格敏感度中等", "受社交推荐影响", "周末活跃度更高"],
      strategy: "通过任务体系和签到机制提升活跃频次，推送限时优惠刺激首购和复购",
      color: "#10B981",
    },
    {
      name: "流失风险", percentage: 25, r: "14-30天未活跃", f: "周均1-2次(下降中)", m: "历史月均 ¥50-100(下降中)",
      characteristics: ["使用频率持续下降", "打开推送但很少点击", "最后一次使用多为被动触发", "对竞品产生兴趣"],
      strategy: "发送个性化召回推送(情感向+利益点)，展示可能错过的内容，提供回归礼包",
      color: "#F59E0B",
    },
    {
      name: "已流失", percentage: 12, r: "超过30天未活跃", f: "几乎为零", m: "已停止付费",
      characteristics: ["完全停止使用", "卸载或静默", "可能已迁移到竞品", "对推送无反应"],
      strategy: "低频(月级)邮件+短信触达，配合重大版本更新或大促活动召回，不强推",
      color: "#EF4444",
    },
  ],
  totalUsers: 12370,
};

function SegmentCard({ segment, defaultExpanded }: { segment: Segment; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderLeft: `3px solid ${segment.color}` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: segment.color }}
            >
              {segment.percentage}%
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{segment.name}</h3>
              <p className="text-xs text-gray-400">{Math.round((segment.percentage / 100) * (DEFAULT_SEGMENTS.totalUsers)).toLocaleString()} 人</p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${segment.percentage}%`, backgroundColor: segment.color }}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-50 pt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <Clock className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">最近使用</p>
              <p className="text-xs font-semibold text-gray-900 mt-0.5">{segment.r}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <Repeat className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">使用频率</p>
              <p className="text-xs font-semibold text-gray-900 mt-0.5">{segment.f}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <DollarSign className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">付费金额</p>
              <p className="text-xs font-semibold text-gray-900 mt-0.5">{segment.m}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-2">行为特征</p>
            <div className="flex flex-wrap gap-1.5">
              {segment.characteristics.map((c, i) => (
                <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2.5"
            style={{ backgroundColor: `${segment.color}08`, border: `1px solid ${segment.color}20` }}
          >
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: segment.color }} />
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">推荐策略</p>
              <p className="text-sm text-gray-700 leading-relaxed">{segment.strategy}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Segmentation() {
  const [data, setData] = useState<SegmentationData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = getItem<SegmentationData | null>("segmentation", null);
    if (saved?.segments?.length) {
      setData(saved);
      setIsDemoData(false);
    }
    setLoaded(true);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/segmentation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: getUserApiKey() || '', productContext: "通用移动应用产品，覆盖社交、内容消费、电商功能" }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.segments?.length) {
          const newData: SegmentationData = { segments: result.segments, totalUsers: result.totalUsers || 0 };
          setData(newData);
          setItem("segmentation", newData);
          setIsDemoData(false);
          setIsGenerating(false);
          return;
        }
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as { error?: string }).error || `请求失败 (${res.status})`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "分析失败，请检查 API 配置");
    }
    setIsGenerating(false);
  };

  const handleUseDemo = () => {
    setData(DEFAULT_SEGMENTS);
    setIsDemoData(true);
    setError(null);
  };

  if (!loaded) return null;

  const segments = data?.segments || [];
  const totalUsers = data?.totalUsers || 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100/50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">RFM 用户分层模型</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          基于最近使用时间（Recency）、使用频率（Frequency）、付费金额（Monetary）将用户分群，总用户 {totalUsers > 0 ? totalUsers.toLocaleString() : "—"} 人。
        </p>

        {segments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {segments.map((s) => (
              <div key={s.name} className="text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.percentage}%</div>
                <div className="text-[11px] text-gray-400">{s.name}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl text-xs"
          >
            {isGenerating ? (
              <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />分析中...</>
            ) : (
              <><Sparkles className="mr-1.5 h-3.5 w-3.5" />{data ? "重新分析" : "AI 分析"}</>
            )}
          </Button>
          {isDemoData && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">演示数据</span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3 max-w-xl">
          <div className="text-sm text-red-700 flex-1">
            <p className="font-medium mb-1">AI 分析失败</p>
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

      {/* Empty State */}
      {!data && !error && !isGenerating && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-10 text-center max-w-xl">
          <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">点击上方按钮，AI 分析用户分群</p>
          <p className="text-gray-400 text-xs">基于 RFM 模型自动识别重度用户、普通用户、流失风险、已流失群体</p>
        </div>
      )}

      {/* Segment Cards */}
      {segments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((segment, i) => (
            <SegmentCard key={segment.name} segment={segment} defaultExpanded={i < 2} />
          ))}
        </div>
      )}
    </div>
  );
}
