"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, BarChart3, Users, Megaphone, TrendingUp,
  ChevronLeft, ChevronRight, Settings, Sparkles, BookOpen, GitBranch,
  CalendarDays, FlaskConical,
} from "lucide-react";

const mainItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard, color: "bg-blue-500", lightColor: "text-blue-600", lightBg: "bg-blue-50", darkBg: "dark:bg-blue-500/10" },
  { href: "/requirements", label: "需求中心", icon: FileText, color: "bg-violet-500", lightColor: "text-violet-600", lightBg: "bg-violet-50", darkBg: "dark:bg-violet-500/10" },
  { href: "/data", label: "数据洞察", icon: BarChart3, color: "bg-emerald-500", lightColor: "text-emerald-600", lightBg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/10" },
  { href: "/users", label: "用户中心", icon: Users, color: "bg-orange-500", lightColor: "text-orange-600", lightBg: "bg-orange-50", darkBg: "dark:bg-orange-500/10" },
  { href: "/operations", label: "运营中心", icon: Megaphone, color: "bg-rose-500", lightColor: "text-rose-600", lightBg: "bg-rose-50", darkBg: "dark:bg-rose-500/10" },
  { href: "/experiments", label: "A/B 实验", icon: FlaskConical, color: "bg-cyan-500", lightColor: "text-cyan-600", lightBg: "bg-cyan-50", darkBg: "dark:bg-cyan-500/10" },
  { href: "/activities", label: "活动管理", icon: CalendarDays, color: "bg-orange-500", lightColor: "text-orange-600", lightBg: "bg-orange-50", darkBg: "dark:bg-orange-500/10" },
  { href: "/competitor", label: "竞品追踪", icon: TrendingUp, color: "bg-red-500", lightColor: "text-red-600", lightBg: "bg-red-50", darkBg: "dark:bg-red-500/10" },
  { href: "/knowledge", label: "知识库", icon: BookOpen, color: "bg-amber-500", lightColor: "text-amber-600", lightBg: "bg-amber-50", darkBg: "dark:bg-amber-500/10" },
  { href: "/versions", label: "版本管理", icon: GitBranch, color: "bg-teal-500", lightColor: "text-teal-600", lightBg: "bg-teal-50", darkBg: "dark:bg-teal-500/10" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Hide sidebar on landing page
  if (pathname === "/") return null;

  const isActive = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    return pathname.startsWith(href) && href !== "/dashboard";
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 z-40 flex flex-col transition-all duration-300 ease-in-out max-md:hidden ${
        collapsed ? "w-[64px]" : "w-[224px]"
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 ${collapsed ? "justify-center px-0" : ""}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shrink-0 shadow-sm shadow-gray-900/10 transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-gray-900 tracking-tight">Pulse</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {mainItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? "bg-gray-100/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              {active && !collapsed && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full ${item.color}`} />
              )}
              <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${item.color}`} />
              <item.icon
                className={`w-[18px] h-[18px] shrink-0 transition-colors duration-200 ${
                  active ? item.lightColor + " dark:text-gray-100" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400"
                }`}
                strokeWidth={active ? 2 : 1.5}
              />
              {!collapsed && <span>{item.label}</span>}
              {active && collapsed && (
                <span className={`absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${item.color}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`p-3 border-t border-gray-50 dark:border-gray-800 ${collapsed ? "flex flex-col items-center gap-1" : ""}`}>
        <Link
          href="/team"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
            isActive("/team")
              ? "bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          } ${collapsed ? "justify-center px-0 w-full" : ""}`}
        >
          <Users className={`w-[18px] h-[18px] shrink-0 ${isActive("/team") ? "text-gray-900 dark:text-gray-100" : ""}`} strokeWidth={isActive("/team") ? 2 : 1.5} />
          {!collapsed && <span className="text-sm">团队</span>}
        </Link>

        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
            isActive("/settings")
              ? "bg-gray-100/80 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          } ${collapsed ? "justify-center px-0 w-full" : ""}`}
        >
          <Settings className={`w-[18px] h-[18px] shrink-0 ${isActive("/settings") ? "text-gray-900 dark:text-gray-100" : ""}`} strokeWidth={isActive("/settings") ? 2 : 1.5} />
          {!collapsed && <span className="text-sm">设置</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 ${
            collapsed ? "justify-center px-0 w-full" : "w-full"
          }`}
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px]" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
              <span className="text-xs">收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
