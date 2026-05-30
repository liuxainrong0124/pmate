"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FileText, Type } from "lucide-react";
import { FileDropzone } from "@/components/shared/file-dropzone";
import type { ParsedFile } from "@/lib/parsers/file-parser";

interface FeedbackInputProps { onSubmit: (text: string) => void; isLoading: boolean; }

export function FeedbackInput({ onSubmit, isLoading }: FeedbackInputProps) {
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");

  const handleSubmit = () => { if (text.trim() && !isLoading) onSubmit(text.trim()); };

  const handleFilesParsed = (files: ParsedFile[]) => {
    const fileTexts = files.map((f) => `--- 文件: ${f.name} (${f.type}) ---\n${f.text}`).join("\n\n");
    setText((prev) => (prev.trim() ? prev + "\n\n" + fileTexts : fileTexts));
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setInputMode("paste")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
            ${inputMode === "paste" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
        >
          <Type className="w-3.5 h-3.5" /> 粘贴文本
        </button>
        <button
          onClick={() => setInputMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
            ${inputMode === "upload" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
        >
          <FileText className="w-3.5 h-3.5" /> 上传文件
        </button>
      </div>

      {inputMode === "upload" && (
        <FileDropzone onFilesParsed={handleFilesParsed} />
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          {inputMode === "upload" ? "已解析的反馈内容" : "粘贴用户反馈内容"}
        </label>
        <Textarea
          placeholder={
            inputMode === "paste"
              ? "粘贴 App Store 评论、用户访谈记录、问卷填写内容...\n\n支持批量粘贴，每条反馈用换行分隔"
              : "上传文件后，解析的文本内容将自动填入此处。你也可以直接编辑..."
          }
          value={text} onChange={(e) => setText(e.target.value)} rows={10}
          className="resize-y min-h-[200px] border-gray-200 dark:border-gray-700 rounded-xl focus:border-emerald-300 dark:focus:border-emerald-600 focus:ring-emerald-50 dark:focus:ring-emerald-500/10"
          disabled={isLoading} />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={!text.trim() || isLoading}
          className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900 text-white shadow-sm rounded-xl transition-all duration-200">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</>
            : <><Sparkles className="mr-2 h-4 w-4" />开始分析</>}
        </Button>
        <span className="text-xs text-gray-400 dark:text-gray-500">已输入 {text.length} 字符</span>
      </div>
    </div>
  );
}
