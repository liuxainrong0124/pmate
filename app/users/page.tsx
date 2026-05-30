"use client";

import { useState } from "react";
import { Users, UserRound, MessageSquare, TrendingUp } from "lucide-react";
import { Segmentation } from "@/components/users/segmentation";
import { PersonaGenerator } from "@/components/users/persona-generator";
import { FeedbackAggregation } from "@/components/users/feedback-aggregation";

type Tab = "segments" | "personas" | "feedback";

const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: "segments", label: "用户分层", icon: TrendingUp },
  { key: "personas", label: "画像生成", icon: UserRound },
  { key: "feedback", label: "反馈聚合", icon: MessageSquare },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("segments");

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-blue-200/60 dark:from-blue-500/15 to-transparent pointer-events-none" />
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">用户中心</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">用户分层、画像生成、反馈聚合分析</p>
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

      {activeTab === "segments" && <Segmentation />}
      {activeTab === "personas" && <PersonaGenerator />}
      {activeTab === "feedback" && <FeedbackAggregation />}
    </div>
  );
}
