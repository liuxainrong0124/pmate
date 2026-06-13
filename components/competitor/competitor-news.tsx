"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getUserApiKey } from "@/lib/store/local-store";
import {
  Rss, Loader2, Sparkles, ExternalLink, TrendingUp,
  AlertTriangle, Newspaper,
} from "lucide-react";

export interface CompetitorNewsItem {
  title: string;
  summary: string;
  date: string;
  category: string;
  impact: string;
  url: string;
}

const categoryColors: Record<string, string> = {
  "产品更新": "bg-blue-100 text-blue-700",
  "融资并购": "bg-green-100 text-green-700",
  "战略合作": "bg-purple-100 text-purple-700",
  "人事变动": "bg-orange-100 text-orange-700",
  "市场扩张": "bg-cyan-100 text-cyan-700",
  "定价策略": "bg-amber-100 text-amber-700",
  "技术突破": "bg-red-100 text-red-700",
};

const categoryIcons: Record<string, string> = {
  "产品更新": "🆕",
  "融资并购": "💰",
  "战略合作": "🤝",
  "人事变动": "👤",
  "市场扩张": "🌍",
  "定价策略": "💲",
  "技术突破": "⚡",
};

interface CompetitorNewsProps {
  competitors: string;
}

export function CompetitorNews({ competitors }: CompetitorNewsProps) {
  const [news, setNews] = useState<CompetitorNewsItem[]>([]);
  const [trendSummary, setTrendSummary] = useState("");
  const [keyChanges, setKeyChanges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/competitor/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: getUserApiKey() || "",
          competitors,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || "抓取失败");
      }

      const data = await res.json();
      setNews(data.news || []);
      setTrendSummary(data.trendSummary || "");
      setKeyChanges(data.keyChanges || []);
      setHasFetched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "请求失败");
    }
    setIsLoading(false);
  };

  // Group news by date (week buckets)
  const sortedNews = [...news].sort((a, b) => b.date.localeCompare(a.date));

  if (!hasFetched) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center">
        <Rss className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-3">自动抓取竞品近期动态</p>
        <p className="text-xs text-gray-400 mb-4">AI 将生成竞品在过去 30 天内的关键动态、趋势总结和竞争格局变化</p>
        <Button
          onClick={handleFetch}
          disabled={isLoading}
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl"
        >
          {isLoading ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />抓取中...</>
          ) : (
            <><Rss className="mr-1.5 h-3.5 w-3.5" />自动抓取动态</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm text-gray-900">竞品动态</h3>
          <span className="text-xs text-gray-400">{news.length} 条</span>
        </div>
        <Button
          onClick={handleFetch}
          disabled={isLoading}
          size="sm"
          variant="outline"
          className="rounded-xl text-xs border-gray-200"
        >
          {isLoading ? (
            <><Loader2 className="mr-1 h-3 w-3 animate-spin" />更新中</>
          ) : (
            <><Sparkles className="mr-1 h-3 w-3" />刷新</>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Trend Summary */}
      {trendSummary && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3">
          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">{trendSummary}</p>
            {keyChanges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keyChanges.map((kc, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-amber-700 font-medium">
                    {kc}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* News Timeline */}
      <div className="space-y-3">
        {sortedNews.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3">
              {/* Date badge */}
              <div className="shrink-0 w-12 text-center">
                <div className="text-xs font-bold text-gray-900">
                  {item.date.slice(5).replace("-", "/")}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {item.date.slice(8)}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoryColors[item.category] || "bg-gray-100 text-gray-600"}`}>
                    {categoryIcons[item.category] || ""} {item.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{item.summary}</p>

                {/* Impact */}
                {item.impact && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                    <TrendingUp className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                    <span>{item.impact}</span>
                  </div>
                )}

                {/* Source link */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    查看来源
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {news.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <Newspaper className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">暂无动态数据</p>
        </div>
      )}
    </div>
  );
}
