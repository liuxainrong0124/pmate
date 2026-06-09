"use client";

import { useState, useEffect } from "react";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string;
  desc: string;
  scope: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    {
      keys: "Ctrl+K",
      desc: "打开全局搜索",
      scope: "全局",
      action: () => {
        const searchBtn = document.querySelector('[data-global-search]') as HTMLButtonElement;
        searchBtn?.click();
      },
    },
    {
      keys: "?",
      desc: "打开快捷键帮助",
      scope: "全局",
      action: () => setHelpOpen(true),
    },
    {
      keys: "Ctrl+N",
      desc: "新建需求",
      scope: "需求中心",
      action: () => {
        if (window.location.pathname.startsWith("/requirements")) {
          const btn = document.querySelector('[data-create-requirement]') as HTMLButtonElement;
          btn?.click();
        }
      },
    },
    {
      keys: "Ctrl+S",
      desc: "保存当前表单",
      scope: "全局",
      action: () => {
        const saveBtn = document.querySelector('[data-save-form]') as HTMLButtonElement;
        saveBtn?.click();
      },
    },
    {
      keys: "Escape",
      desc: "关闭弹窗/面板",
      scope: "全局",
      action: () => { /* handled by individual components */ },
    },
  ];

  return { shortcuts, helpOpen, setHelpOpen };
}

export function KeyboardHelpPanel({
  open,
  onClose,
  shortcuts,
}: {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const scopes = Array.from(new Set(shortcuts.map(s => s.scope)));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
          <div className="relative w-full max-w-[460px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in mx-4">
            <div className="flex items-center gap-2 mb-5">
              <Keyboard className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">键盘快捷键</h2>
            </div>

            {scopes.map(scope => (
              <div key={scope} className="mb-4">
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{scope}</h3>
                <div className="space-y-1">
                  {shortcuts.filter(s => s.scope === scope).map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{s.desc}</span>
                      <kbd className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md font-mono text-gray-600 dark:text-gray-300">
                        {s.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p className="text-[10px] text-gray-400 mt-4">
              按 <kbd className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">?</kbd> 随时打开此面板
            </p>
          </div>
        </div>
      )}
    </>
  );
}
