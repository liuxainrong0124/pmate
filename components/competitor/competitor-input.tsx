"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";

interface CompetitorInputProps {
  onSubmit: (competitors: string, context?: string) => void;
  isLoading: boolean;
}

export function CompetitorInput({ onSubmit, isLoading }: CompetitorInputProps) {
  const [competitors, setCompetitors] = useState("");
  const [context, setContext] = useState("");

  const handleSubmit = () => {
    if (competitors.trim() && !isLoading) {
      onSubmit(competitors.trim(), context.trim() || undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          竞品名称 <span className="text-red-400">*</span>
        </label>
        <Textarea
          placeholder="输入要分析的竞品，每行一个&#10;&#10;例如：&#10;Notion&#10;飞书文档&#10;Confluence"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
          rows={5}
          className="resize-y min-h-[100px] border-gray-200 rounded-xl focus:border-amber-300 focus:ring-amber-50"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          我方产品背景 <span className="text-gray-400 font-normal">（选填）</span>
        </label>
        <Input
          placeholder="简要描述你的产品定位、目标用户、核心功能..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="border-gray-200 rounded-xl focus:border-amber-300 focus:ring-amber-50"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!competitors.trim() || isLoading}
          className="bg-gray-900 hover:bg-gray-800 text-white shadow-sm rounded-xl transition-all duration-200"
        >
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />开始分析</>
          )}
        </Button>
        <span className="text-xs text-gray-400">
          {competitors.trim() ? `${competitors.split("\n").filter(Boolean).length} 个竞品` : "请输入竞品名称"}
        </span>
      </div>
    </div>
  );
}
