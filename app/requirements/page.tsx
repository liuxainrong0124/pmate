"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, AlertTriangle, ListFilter } from "lucide-react";
import { PrdInput } from "@/components/prd/prd-input";
import { PrdOutputDisplay } from "@/components/prd/prd-output";
import { PrdProgressBar } from "@/components/prd/prd-progress";
import { AnomalyGenerator } from "@/components/requirements/anomaly-generator";
import { RequirementsPool } from "@/components/requirements/requirements-pool";
import { PrdInput as PrdInputType, PrdOutput, PrdProgress } from "@/types";
import { parsePrdResponse } from "@/lib/ai/parsers/prd-parser";
import { ExportButton } from "@/components/shared/export-button";
import ReactMarkdown from "react-markdown";
import { getUserApiKey } from "@/lib/store/local-store";
import { Sparkles, ArrowLeftRight } from "lucide-react";

type Tab = "prd" | "anomaly" | "pool";

const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: "prd", label: "PRD编辑器", icon: FileText },
  { key: "anomaly", label: "异常场景", icon: AlertTriangle },
  { key: "pool", label: "需求池", icon: ListFilter },
];

function RequirementsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "prd";
  const fromModule = searchParams.get("from");
  const initialTitle = searchParams.get("title") || "";
  const initialDescription = searchParams.get("description") || "";
  const initialContext = searchParams.get("context") || "";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [output, setOutput] = useState<PrdOutput | null>(null);
  const [progress, setProgress] = useState<PrdProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  const handleSubmit = async (input: PrdInputType) => {
    setIsLoading(true); setError(null); setOutput(null); setProgress(null); setRawText("");
    try {
      const res = await fetch("/api/prd/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, apiKey: getUserApiKey() || '' }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "生成失败"); }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder(); let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") setProgress(data.progress);
            else if (data.type === "chunk") { fullText += data.content; setRawText(fullText); }
            else if (data.type === "done") { const parsed = parsePrdResponse(fullText); setOutput(parsed); }
            else if (data.type === "error") throw new Error(data.message);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-violet-200/60 dark:from-violet-500/15 to-transparent pointer-events-none" />
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">需求中心</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">PRD生成、异常场景分析、需求池管理</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl mb-6 w-fit animate-fade-in">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "prd" && (
        <div className="max-w-3xl">
          {fromModule && (
            <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-violet-50 dark:from-violet-500/10 to-indigo-50 dark:to-indigo-500/10 border border-violet-100 dark:border-violet-500/20 flex items-center gap-2.5 text-sm animate-fade-in">
              <ArrowLeftRight className="w-4 h-4 text-violet-500" />
              <span className="text-gray-600 dark:text-gray-300">
                来自 <b className="text-violet-700 dark:text-violet-400">{fromModule === "feedback" ? "用户反馈分析" : "竞品动态追踪"}</b> 的需求
              </span>
            </div>
          )}
          <div className="animate-fade-in">
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm mb-6">
              <PrdInput onSubmit={handleSubmit} isLoading={isLoading} initialFeatureName={initialTitle} initialDescription={initialDescription} initialContext={initialContext} />
            </div>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800">{error}</div>}
          <PrdProgressBar progress={progress} />

          {!output && !isLoading && (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 p-10 text-center mt-6 animate-fade-in">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">填入需求信息，点击生成</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">支持新功能、功能优化、运营活动三种模板</p>
            </div>
          )}

          {isLoading && rawText && (
            <div className="mt-6 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm animate-fade-in">
              <div className="prose prose-sm max-w-none"><ReactMarkdown>{rawText.replace(/---PROGRESS---/g, "")}</ReactMarkdown></div>
            </div>
          )}

          {output && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mt-8 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">生成的PRD</h2>
                <ExportButton data={output} type="prd" filename={`prd-${Date.now()}`} label="导出" />
              </div>
              <PrdOutputDisplay output={output} />
            </div>
          )}
        </div>
      )}

      {activeTab === "anomaly" && <AnomalyGenerator />}
      {activeTab === "pool" && <RequirementsPool />}
    </div>
  );
}

export default function RequirementsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1120px] mx-auto px-6 py-8"><div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" /></div>}>
      <RequirementsContent />
    </Suspense>
  );
}
