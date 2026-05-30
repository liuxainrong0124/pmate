"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, FileText, FileJson, Presentation, FileSpreadsheet, Loader2 } from "lucide-react";
import type { FeedbackReport, CompetitorReport, PrdOutput } from "@/types";

type ExportType = "feedback" | "competitor" | "prd";

interface ExportButtonProps {
  data: FeedbackReport | CompetitorReport | PrdOutput;
  type: ExportType;
  filename?: string;
  label?: string;
}

export function ExportButton({ data, type, filename = "report", label = "导出" }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
    setIsExporting(false);
  };

  const handleMarkdown = () => {
    if (type === "prd") {
      const d = data as PrdOutput;
      triggerDownload(new Blob([d.fullMarkdown], { type: "text/markdown;charset=utf-8" }), "md");
    } else {
      triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "json");
    }
  };

  const handleCsv = () => {
    if (type === "prd") {
      const d = data as PrdOutput;
      const csv = `section,content\n${d.fullMarkdown.split("\n").map(l => l.replace(/"/g, '""')).map((l, i) => `"line_${i}","${l}"`).join("\n")}`;
      triggerDownload(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), "csv");
    } else {
      const flat = JSON.stringify(data, null, 2);
      triggerDownload(new Blob(["﻿" + flat], { type: "text/csv;charset=utf-8" }), "csv");
    }
  };

  const handleExport = async (format: "docx" | "pptx") => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data, format }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "导出失败" }));
        throw new Error(err.error || "导出失败");
      }

      const blob = await res.blob();
      triggerDownload(blob, format);
    } catch (err) {
      console.error("Export failed:", err);
      setIsExporting(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        variant="outline"
        size="sm"
        onClick={() => !isExporting && setIsOpen(!isOpen)}
        disabled={isExporting}
        className="rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
      >
        {isExporting ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isExporting ? "导出中..." : label}
        <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 py-1 z-50 animate-in fade-in zoom-in-95 origin-top-right">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">文本格式</div>
          <button
            onClick={handleMarkdown}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileJson className="w-4 h-4 text-gray-400" />
            {type === "prd" ? "Markdown (.md)" : "JSON (.json)"}
          </button>
          <button
            onClick={handleCsv}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            CSV (.csv)
          </button>
          <div className="border-t border-gray-100 my-1" />
          <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">文档格式</div>
          <button
            onClick={() => handleExport("docx")}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            Word (.docx)
          </button>
          {(type === "feedback" || type === "competitor") && (
            <button
              onClick={() => handleExport("pptx")}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Presentation className="w-4 h-4 text-orange-500" />
              PPT (.pptx)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
