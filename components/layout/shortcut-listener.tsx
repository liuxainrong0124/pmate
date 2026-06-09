"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyboardHelpPanel } from "@/components/layout/keyboard-shortcuts";
import { showToast } from "@/components/shared/toast";

export function ShortcutListener() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // ? for help (only when not in input)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey && !isInput) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Ctrl+N for new requirement
      if (e.key === "n" && (e.ctrlKey || e.metaKey) && !e.altKey) {
        if (window.location.pathname.startsWith("/requirements")) {
          e.preventDefault();
          const btn = document.querySelector('[data-create-requirement]') as HTMLButtonElement;
          btn?.click();
        }
        return;
      }

      // Ctrl+S for save
      if (e.key === "s" && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const btn = document.querySelector('[data-save-form]') as HTMLButtonElement;
        if (btn) {
          btn.click();
          showToast("已保存", "success");
        }
        return;
      }

      // Ctrl+D for dashboard
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && e.altKey) {
        e.preventDefault();
        router.push("/dashboard");
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const shortcuts = [
    { keys: "Ctrl+K", desc: "打开全局搜索", scope: "全局" },
    { keys: "Ctrl+N", desc: "新建需求（需求中心）", scope: "需求中心" },
    { keys: "Ctrl+S", desc: "保存当前表单", scope: "全局" },
    { keys: "Ctrl+Alt+D", desc: "前往仪表盘", scope: "全局" },
    { keys: "?", desc: "打开快捷键帮助", scope: "全局" },
    { keys: "Escape", desc: "关闭弹窗/面板", scope: "全局" },
  ];

  return (
    <KeyboardHelpPanel
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      shortcuts={shortcuts.map(s => ({ ...s, action: () => {} }))}
    />
  );
}
