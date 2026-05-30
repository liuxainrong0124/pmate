"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  List,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  getActivities,
  updateActivity,
  deleteActivity,
  addLog,
  StoredActivity,
} from "@/lib/store/local-store";
import { showToast } from "@/components/shared/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActivityForm } from "@/components/activities/activity-form";
import { ActivityEffect } from "@/components/activities/activity-effect";
import { TemplateManager } from "@/components/activities/template-manager";

type ViewMode = "calendar" | "list";

const statusLabels: Record<StoredActivity["status"], string> = {
  upcoming: "即将开始",
  active: "进行中",
  ended: "已结束",
};

const statusColors: Record<
  StoredActivity["status"],
  { dot: string; badge: "default" | "secondary" | "outline" }
> = {
  upcoming: { dot: "bg-blue-500", badge: "default" },
  active: { dot: "bg-emerald-500", badge: "secondary" },
  ended: { dot: "bg-gray-400 dark:bg-gray-500", badge: "outline" },
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<StoredActivity[]>(getActivities);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StoredActivity["status"] | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<StoredActivity | undefined>();
  const [prefillDate, setPrefillDate] = useState<string>("");
  const [effectActivity, setEffectActivity] = useState<StoredActivity | undefined>();

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const refresh = () => setActivities(getActivities());

  // Filtered / sorted
  const filtered = useMemo(() => {
    let list = [...activities];
    if (filterStatus !== "all") {
      list = list.filter((a) => a.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.targetAudience.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return list;
  }, [activities, filterStatus, search]);

  // Calendar data
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const activitiesByDate = useMemo(() => {
    const map: Record<string, StoredActivity[]> = {};
    activities.forEach((a) => {
      const start = new Date(a.startDate);
      const end = new Date(a.endDate);
      const y = calYear;
      const m = calMonth;
      for (
        let d = new Date(start);
        d <= end;
        d.setDate(d.getDate() + 1)
      ) {
        if (d.getFullYear() === y && d.getMonth() === m) {
          const key = String(d.getDate());
          if (!map[key]) map[key] = [];
          map[key].push(a);
        }
      }
    });
    return map;
  }, [activities, calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear(calYear - 1);
      setCalMonth(11);
    } else {
      setCalMonth(calMonth - 1);
    }
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalYear(calYear + 1);
      setCalMonth(0);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setPrefillDate(dateStr);
    setEditingActivity(undefined);
    setFormOpen(true);
  };

  const handleActivityClick = (e: React.MouseEvent, act: StoredActivity) => {
    e.stopPropagation();
    setPrefillDate("");
    setEditingActivity(act);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const act = activities.find((a) => a.id === id);
    deleteActivity(id);
    addLog("删除", `活动 ${act?.name || id}`, "删除活动");
    showToast("活动已删除", "success");
    refresh();
  };

  const handleFormSave = () => {
    setFormOpen(false);
    setEditingActivity(undefined);
    setPrefillDate("");
    refresh();
  };

  const handleStatusChange = (act: StoredActivity, status: StoredActivity["status"]) => {
    updateActivity(act.id, { status });
    addLog("修改", `活动 ${act.name}`, `状态 → ${statusLabels[status]}`);
    showToast("状态已更新", "success");
    refresh();
  };

  const isToday = (day: number) =>
    today.getFullYear() === calYear &&
    today.getMonth() === calMonth &&
    today.getDate() === day;

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-orange-200/60 dark:from-orange-500/15 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-orange-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">活动管理</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              创建、管理和追踪运营活动
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
        <Button
          onClick={() => {
            setPrefillDate("");
            setEditingActivity(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          新建活动
        </Button>

        <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "list"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <List className="w-4 h-4" />
            列表
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "calendar"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            日历
          </button>
        </div>
      </div>

      {/* Template Manager */}
      <div className="mb-6 animate-fade-in">
        <TemplateManager
          onUseTemplate={(tpl) => {
            setPrefillDate("");
            setEditingActivity(undefined);
            setFormOpen(true);
            // pass template data via a sessionStorage hack or lift state
            if (typeof window !== "undefined") {
              sessionStorage.setItem("activity_prefill_template", tpl.id);
            }
          }}
        />
      </div>

      {/* ======== CALENDAR VIEW ======== */}
      {viewMode === "calendar" && (
        <div className="animate-fade-in">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {calYear}年 {calMonth + 1}月
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Calendar grid */}
          <div className="glass rounded-2xl overflow-hidden">
            {/* Desktop grid */}
            <div className="hidden md:grid grid-cols-7">
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="text-center py-2 text-xs font-medium text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800"
                >
                  {d}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const acts = day ? activitiesByDate[String(day)] || [] : [];
                return (
                  <div
                    key={idx}
                    onClick={() => day && handleDateClick(day)}
                    className={`min-h-[90px] border-b border-r border-gray-100 dark:border-gray-800 p-1.5 ${
                      day ? "cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40" : "bg-gray-50/30 dark:bg-gray-900/20"
                    }`}
                  >
                    {day && (
                      <>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                            isToday(day)
                              ? "bg-orange-500 text-white"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="flex flex-wrap gap-0.5">
                          {acts.slice(0, 3).map((act) => (
                            <button
                              key={act.id}
                              onClick={(e) => handleActivityClick(e, act)}
                              className={`w-2 h-2 rounded-full ${statusColors[act.status].dot} hover:scale-125 transition-transform`}
                              title={act.name}
                            />
                          ))}
                          {acts.length > 3 && (
                            <span className="text-[10px] text-gray-400 ml-0.5">
                              +{acts.length - 3}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile week view */}
            <div className="md:hidden">
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                {weekDays.map((d) => (
                  <div
                    key={d}
                    className="text-center py-2 text-xs font-medium text-gray-400 dark:text-gray-500"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map(
                (_, rowIdx) => {
                  const week = calendarDays.slice(rowIdx * 7, rowIdx * 7 + 7);
                  return (
                    <div key={rowIdx} className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                      {week.map((day, colIdx) => {
                        const acts = day ? activitiesByDate[String(day)] || [] : [];
                        return (
                          <div
                            key={colIdx}
                            onClick={() => day && handleDateClick(day)}
                            className={`py-2 text-center cursor-pointer ${
                              day ? "hover:bg-gray-50/60 dark:hover:bg-gray-800/40" : ""
                            }`}
                          >
                            {day && (
                              <>
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                    isToday(day)
                                      ? "bg-orange-500 text-white"
                                      : "text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  {day}
                                </span>
                                {acts.length > 0 && (
                                  <div className="flex justify-center gap-0.5 mt-1">
                                    {acts.slice(0, 2).map((act) => (
                                      <span
                                        key={act.id}
                                        className={`w-1.5 h-1.5 rounded-full ${statusColors[act.status].dot}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======== LIST VIEW ======== */}
      {viewMode === "list" && (
        <div className="animate-fade-in">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索活动名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as StoredActivity["status"] | "all")
              }
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="all">全部状态</option>
              <option value="upcoming">即将开始</option>
              <option value="active">进行中</option>
              <option value="ended">已结束</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state glass py-16">
              <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-400 dark:text-gray-500">还没有活动，创建第一个</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setPrefillDate("");
                  setEditingActivity(undefined);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                新建活动
              </Button>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                      <th className="px-4 py-3 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        活动名称
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        时间范围
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        目标人群
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        状态
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        参与人数
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((act) => (
                      <tr
                        key={act.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {act.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {act.startDate} ~ {act.endDate}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[160px] truncate">
                          {act.targetAudience}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={statusColors[act.status].badge}
                            className={
                              act.status === "upcoming"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                : act.status === "active"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {statusLabels[act.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                          {act.participants > 0
                            ? act.participants.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                setPrefillDate("");
                                setEditingActivity(act);
                                setFormOpen(true);
                              }}
                            >
                              编辑
                            </Button>
                            {act.status === "ended" && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => setEffectActivity(act)}
                              >
                                效果
                              </Button>
                            )}
                            {act.status === "upcoming" && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleStatusChange(act, "active")}
                              >
                                启动
                              </Button>
                            )}
                            {act.status === "active" && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleStatusChange(act, "ended")}
                              >
                                结束
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleDelete(act.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Form Dialog */}
      <ActivityForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingActivity(undefined);
          setPrefillDate("");
        }}
        onSave={handleFormSave}
        activity={editingActivity}
        prefillDate={prefillDate}
      />

      {/* Activity Effect Dialog */}
      {effectActivity && (
        <ActivityEffect
          open={!!effectActivity}
          onClose={() => setEffectActivity(undefined)}
          activity={effectActivity}
          onUpdate={refresh}
        />
      )}
    </div>
  );
}
