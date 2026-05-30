"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/shared/toast";
import {
  getActivities,
  updateActivity,
  addLog,
  StoredActivity,
} from "@/lib/store/local-store";
import { BarChart3, TrendingUp, MousePointerClick, Users, DollarSign } from "lucide-react";

interface ActivityEffectProps {
  open: boolean;
  onClose: () => void;
  activity: StoredActivity;
  onUpdate: () => void;
}

export function ActivityEffect({
  open,
  onClose,
  activity,
  onUpdate,
}: ActivityEffectProps) {
  const [participants, setParticipants] = useState(activity.participants);
  const [clickRate, setClickRate] = useState(activity.clickRate);
  const [conversionRate, setConversionRate] = useState(activity.conversionRate);

  useEffect(() => {
    if (open) {
      setParticipants(activity.participants);
      setClickRate(activity.clickRate);
      setConversionRate(activity.conversionRate);
    }
  }, [open, activity]);

  const roi = useMemo(() => {
    if (participants === 0 || conversionRate === 0) return 0;
    // Simple ROI simulation: assume each conversion is worth ~50 CNY
    const conversions = Math.round(participants * conversionRate);
    const revenue = conversions * 50;
    const cost = participants * 0.5; // Assume ~0.5 CNY per participant
    return cost > 0 ? Math.round(((revenue - cost) / cost) * 100) / 100 : 0;
  }, [participants, conversionRate]);

  // Historical comparison (same month, past year)
  const historicalActivities = useMemo(() => {
    const all = getActivities();
    const currentMonth = activity.startDate.slice(0, 7);
    return all
      .filter(
        (a) =>
          a.id !== activity.id &&
          a.status === "ended" &&
          a.participants > 0 &&
          a.startDate.slice(0, 7) !== currentMonth
      )
      .slice(0, 5);
  }, [activity]);

  const handleSave = () => {
    updateActivity(activity.id, {
      participants,
      clickRate,
      conversionRate,
    });
    addLog("编辑", `活动 ${activity.name}`, "更新活动效果数据");
    showToast("效果数据已保存", "success");
    onUpdate();
    onClose();
  };

  const formatPct = (v: number) => `${(v * 100).toFixed(1)}%`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle>活动效果 — {activity.name}</DialogTitle>
          <DialogDescription>
            {activity.startDate} ~ {activity.endDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  参与人数
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-blue-700 dark:text-blue-300">
                {participants.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
              <div className="flex items-center gap-2 mb-1">
                <MousePointerClick className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  点击率
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatPct(clickRate)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  转化率
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {formatPct(conversionRate)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  ROI
                </span>
              </div>
              <p className="text-2xl font-bold tabular-nums text-purple-700 dark:text-purple-300">
                {roi.toFixed(1)}x
              </p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              编辑效果数据
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  参与人数
                </label>
                <Input
                  type="number"
                  value={participants}
                  onChange={(e) =>
                    setParticipants(Math.max(0, parseInt(e.target.value) || 0))
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  点击率 (0-1)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={clickRate}
                  onChange={(e) =>
                    setClickRate(Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)))
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  转化率 (0-1)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={conversionRate}
                  onChange={(e) =>
                    setConversionRate(Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)))
                  }
                />
              </div>
            </div>
          </div>

          {/* Historical comparison */}
          {historicalActivities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                历史活动对比
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                      <th className="py-2 px-2 font-medium text-gray-400 dark:text-gray-500">活动</th>
                      <th className="py-2 px-2 font-medium text-gray-400 dark:text-gray-500">参与</th>
                      <th className="py-2 px-2 font-medium text-gray-400 dark:text-gray-500">点击率</th>
                      <th className="py-2 px-2 font-medium text-gray-400 dark:text-gray-500">转化率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalActivities.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-gray-50 dark:border-gray-800/50"
                      >
                        <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                          {h.name}
                        </td>
                        <td className="py-2 px-2 tabular-nums text-gray-600 dark:text-gray-400">
                          {h.participants.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 tabular-nums text-gray-600 dark:text-gray-400">
                          {formatPct(h.clickRate)}
                        </td>
                        <td className="py-2 px-2 tabular-nums text-gray-600 dark:text-gray-400">
                          {formatPct(h.conversionRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button onClick={handleSave}>保存数据</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
