"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone, Send, BarChart3 } from "lucide-react";
import { ContentGenerator } from "@/components/operations/content-generator";
import { PushStrategy } from "@/components/operations/push-strategy";

type Tab = "content" | "strategy";

const tabs: { key: Tab; label: string; icon: typeof Megaphone }[] = [
  { key: "content", label: "内容生成", icon: Send },
  { key: "strategy", label: "推送策略", icon: BarChart3 },
];

function OperationsContent() {
  const searchParams = useSearchParams();
  const initialPersona = searchParams.get("persona") || "";
  const initialSegment = searchParams.get("segment") || "";
  const [activeTab, setActiveTab] = useState<Tab>("content");

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-amber-200/60 dark:from-amber-500/15 to-transparent pointer-events-none" />
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">运营中心</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">内容生成、A/B 文案、推送策略优化</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800 p-1 rounded-xl mb-6 w-fit animate-fade-in">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "content" && (
        <ContentGenerator initialPersona={initialPersona} initialSegment={initialSegment} />
      )}
      {activeTab === "strategy" && <PushStrategy />}
    </div>
  );
}

export default function OperationsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1120px] mx-auto px-6 py-8"><div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" /></div>}>
      <OperationsContent />
    </Suspense>
  );
}
