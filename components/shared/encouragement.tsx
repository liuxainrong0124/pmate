"use client";

import { useEffect, useState } from "react";
import { getItem, setItem } from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { Trophy, Star, Flame } from "lucide-react";

interface UsageStats {
  completedTodos: number;
  completedToday: number;
  streakDays: number;
  lastActiveDate: string;
  weeklyReqs: number;
  monthlyReqs: number;
  totalDays: number;
  achievements: string[];
}

const defaultStats: UsageStats = {
  completedTodos: 0,
  completedToday: 0,
  streakDays: 0,
  lastActiveDate: "",
  weeklyReqs: 0,
  monthlyReqs: 0,
  totalDays: 0,
  achievements: [],
};

export function trackTodoComplete() {
  try {
    const stats = getItem<UsageStats>("usageStats", defaultStats);
    const today = new Date().toISOString().slice(0, 10);

    stats.completedTodos++;
    if (stats.lastActiveDate === today) {
      stats.completedToday++;
    } else {
      stats.completedToday = 1;
    }
    stats.lastActiveDate = today;
    setItem("usageStats", stats);

    // Show encouragement
    if (stats.completedToday === 1) {
      showToast("🎉 干得漂亮！任务已完成", "success");
    } else if (stats.completedTodos % 10 === 0) {
      showToast(`🔥 已完成 ${stats.completedTodos} 个任务，继续保持！`, "success");
    }
  } catch { /* ignore */ }
}

export function trackAppOpen() {
  try {
    const stats = getItem<UsageStats>("usageStats", defaultStats);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday) {
        stats.streakDays++;
      } else if (stats.lastActiveDate !== "") {
        stats.streakDays = 1;
      } else {
        stats.streakDays = 1;
      }
      stats.totalDays++;
      stats.lastActiveDate = today;

      // Streak milestones
      if (stats.streakDays === 7 && !stats.achievements.includes("streak_7")) {
        stats.achievements.push("streak_7");
        setTimeout(() => showToast("🔥 连续使用 7 天！获得「勤奋」徽章", "success"), 1000);
      } else if (stats.streakDays === 30 && !stats.achievements.includes("streak_30")) {
        stats.achievements.push("streak_30");
        setTimeout(() => showToast("⭐ 连续使用 30 天！获得「坚持」徽章", "success"), 1000);
      }

      setItem("usageStats", stats);
    }
  } catch { /* ignore */ }
}

export function trackReqCreate() {
  try {
    const stats = getItem<UsageStats>("usageStats", defaultStats);
    stats.weeklyReqs++;
    stats.monthlyReqs++;
    setItem("usageStats", stats);

    if (stats.weeklyReqs % 5 === 0) {
      showToast(`📋 本周已创建 ${stats.weeklyReqs} 个需求！`, "success");
    }
  } catch { /* ignore */ }
}

export function getUsageStats(): UsageStats {
  try {
    return getItem<UsageStats>("usageStats", defaultStats);
  } catch {
    return defaultStats;
  }
}

export function EncouragementBanner() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    setStats(getUsageStats());
    trackAppOpen();
  }, []);

  if (!stats || stats.totalDays < 2) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-100 p-4 flex items-center gap-3">
      <Flame className="w-5 h-5 text-orange-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">
          已连续使用 <span className="font-bold">{stats.streakDays}</span> 天
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          累计 {stats.totalDays} 天 · {stats.completedTodos} 个任务 · {stats.monthlyReqs} 个需求
        </p>
      </div>
      {stats.achievements.length > 0 && (
        <div className="flex gap-1">
          {stats.achievements.includes("streak_7") && <Trophy className="w-4 h-4 text-amber-500" />}
          {stats.achievements.includes("streak_30") && <Star className="w-4 h-4 text-orange-500" />}
        </div>
      )}
    </div>
  );
}
