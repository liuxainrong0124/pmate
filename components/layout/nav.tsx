"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "首页" },
  { href: "/feedback", label: "反馈分析" },
  { href: "/prd", label: "PRD助手" },
  { href: "/competitor", label: "竞品追踪" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-3 md:mx-auto md:max-w-5xl">
        <div className="flex items-center justify-between h-12 px-4 rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-xl shadow-sm shadow-gray-200/20">
          <Link href="/"
            className="font-bold text-lg tracking-tight text-gray-900">
            PMate
          </Link>
          <div className="flex gap-0.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-gray-900 bg-gray-100"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
