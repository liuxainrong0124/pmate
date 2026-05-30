"use client";

import { useState, useCallback } from "react";
import { FileText, Upload, X, Loader2 } from "lucide-react";
import type { ParsedFile } from "@/lib/parsers/file-parser";

interface FileDropzoneProps {
  onFilesParsed: (files: ParsedFile[]) => void;
  className?: string;
}

export function FileDropzone({ onFilesParsed, className = "" }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      if (fileArr.length === 0) return;

      setIsParsing(true);
      setError(null);

      try {
        const formData = new FormData();
        fileArr.forEach((f) => formData.append("files", f));

        const res = await fetch("/api/parse-file", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "文件解析失败");
        }

        const data = await res.json();
        if (data.files && data.files.length > 0) {
          setParsedFiles((prev) => [...prev, ...data.files]);
          onFilesParsed(data.files);
        }
        if (data.errors && data.errors.length > 0) {
          setError(data.errors.join("; "));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "文件解析失败");
      } finally {
        setIsParsing(false);
        setIsDragOver(false);
      }
    },
    [onFilesParsed]
  );

  const removeFile = (index: number) => {
    setParsedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const typeIcons: Record<string, string> = {
    txt: "bg-gray-100 text-gray-600",
    csv: "bg-emerald-50 text-emerald-600",
    md: "bg-violet-50 text-violet-600",
    json: "bg-amber-50 text-amber-600",
    pdf: "bg-red-50 text-red-600",
    docx: "bg-blue-50 text-blue-600",
    xlsx: "bg-green-50 text-green-600",
    xls: "bg-green-50 text-green-600",
  };

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver
            ? "border-amber-400 bg-amber-50/50 scale-[1.02]"
            : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
          }
          ${isParsing ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".txt,.csv,.md,.pdf,.docx,.xlsx,.xls,.json"
          disabled={isParsing}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm text-gray-500">解析文件中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">点击上传</span> 或拖拽文件到此处
            </p>
            <p className="text-xs text-gray-400">
              支持 TXT, CSV, JSON, PDF, DOCX, XLSX（单文件最大 10MB）
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {parsedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {parsedFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 text-sm hover:border-gray-200 transition-colors"
            >
              <FileText className={`w-8 h-8 p-1.5 rounded-lg ${typeIcons[file.type] || "bg-gray-50 text-gray-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-medium truncate">{file.name}</p>
                <p className="text-gray-400 text-xs">
                  {file.type.toUpperCase()} · {formatSize(file.size)} · {file.text.length} 字符
                </p>
              </div>
              <button
                onClick={() => removeFile(i)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
