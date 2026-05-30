"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, BarChart3, Users, Menu } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/requirements", label: "需求", icon: FileText },
  { href: "/data", label: "数据", icon: BarChart3 },
  { href: "/users", label: "用户", icon: Users },
  { href: "/operations", label: "运营", icon: Menu },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors tap-none ${
                isActive ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
