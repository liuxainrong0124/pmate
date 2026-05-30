"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X, Check, ArrowRight, FileJson, FileText } from "lucide-react";
import { getUploadedMetrics, setUploadedMetrics, StoredMetric } from "@/lib/store/local-store";

interface ParsedData {
  fileName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
  format: string;
}

const METRIC_KEYWORDS: Record<string, string> = {
  dau: "DAU", dailya: "DAU", active: "DAU",
  retention: "次日留存", "次日": "次日留存", "留存": "次日留存",
  push: "推送打开率", open: "推送打开率", "推送": "推送打开率",
  ltv: "LTV",
  conversion: "转化率", cvr: "转化率", "转化": "转化率",
  churn: "周流失率", "流失": "周流失率",
};

function detectMetric(headers: string[]): string | null {
  const headerStr = headers.join(" ").toLowerCase();
  for (const [keyword, metric] of Object.entries(METRIC_KEYWORDS)) {
    if (headerStr.includes(keyword)) return metric;
  }
  return null;
}

function detectDateAndValueColumns(headers: string[], rows: string[][]): { dateIdx: number; valueIdx: number } {
  const headerLower = headers.map(h => h.toLowerCase());
  let dateIdx = headerLower.findIndex(h => h.includes("date") || h.includes("日期") || h.includes("时间") || h.includes("day"));
  if (dateIdx < 0) dateIdx = 0;
  let valueIdx = -1;
  for (let i = 0; i < headers.length; i++) {
    if (i === dateIdx) continue;
    const sample = rows.slice(0, 3).map(r => parseFloat(r[i])).filter(v => !isNaN(v));
    if (sample.length >= 2) { valueIdx = i; break; }
  }
  if (valueIdx < 0) valueIdx = dateIdx === 0 ? 1 : 0;
  return { dateIdx, valueIdx };
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  });
  return { headers, rows };
}

const SUPPORTED_FORMATS = [
  { ext: ".csv", label: "CSV", icon: FileText },
  { ext: ".xlsx", label: "Excel", icon: FileSpreadsheet },
  { ext: ".xls", label: "Excel", icon: FileSpreadsheet },
  { ext: ".json", label: "JSON", icon: FileJson },
];

function formatIcon(format: string) {
  if (format === "csv") return <FileText className="w-6 h-6 text-emerald-600" />;
  if (format === "xlsx" || format === "xls") return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
  return <FileJson className="w-6 h-6 text-emerald-600" />;
}

export function DataUpload() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let headers: string[] = [];
      let rows: string[][] = [];
      let format = ext;

      if (ext === "csv" || file.type === "text/csv") {
        const text = await file.text();
        const parsed = parseCSV(text);
        headers = parsed.headers;
        rows = parsed.rows;
        format = "csv";
      } else if (ext === "json") {
        const text = await file.text();
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : [json];
        if (arr.length === 0) throw new Error("JSON 文件为空");
        headers = Object.keys(arr[0]);
        rows = arr.map((item: Record<string, unknown>) => headers.map(h => String(item[h] ?? "")));
        format = "json";
      } else if (ext === "xlsx" || ext === "xls") {
        // Parse via API for Excel files
        const formData = new FormData();
        formData.append("files", file);
        const res = await fetch("/api/parse-file", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Excel 解析失败");
        const data = await res.json();
        if (data.files?.[0]?.text) {
          const parsed = parseCSV(data.files[0].text);
          headers = parsed.headers;
          rows = parsed.rows;
          format = ext;
        } else {
          throw new Error("Excel 文件解析后内容为空");
        }
      } else {
        throw new Error(`不支持的文件格式: .${ext}。支持 CSV、Excel (.xlsx/.xls)、JSON`);
      }

      if (headers.length === 0 || rows.length === 0) {
        throw new Error("文件中没有找到有效数据");
      }

      const detectedMetric = detectMetric(headers);
      setParsedData({ fileName: file.name, headers, rows: rows.slice(0, 100), totalRows: rows.length, format });
      setSelectedMetric(detectedMetric);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "文件解析失败");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSave = () => {
    if (!parsedData) return;
    const { dateIdx, valueIdx } = detectDateAndValueColumns(parsedData.headers, parsedData.rows);
    const dates: string[] = [];
    const values: number[] = [];
    for (const row of parsedData.rows) {
      const v = parseFloat(row[valueIdx]);
      if (!isNaN(v)) {
        dates.push(row[dateIdx] || "");
        values.push(v);
      }
    }

    const metric: StoredMetric = {
      id: `metric-${Date.now()}`,
      label: selectedMetric || parsedData.fileName.replace(/\.[^.]+$/, ""),
      values,
      dates,
    };

    const existing = getUploadedMetrics();
    const filtered = existing.filter(m => m.label !== metric.label);
    setUploadedMetrics([...filtered, metric]);
    setSaved(true);
  };

  const acceptFormats = SUPPORTED_FORMATS.map(s => s.ext).join(",");

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      {/* Format badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-medium text-gray-400">支持格式:</span>
        {SUPPORTED_FORMATS.map((f) => (
          <div key={f.ext} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600">
            <f.icon className="w-3.5 h-3.5 text-gray-400" />
            {f.label}
          </div>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          parsedData
            ? "border-emerald-200 bg-emerald-50/30"
            : error
              ? "border-red-200 bg-red-50/30"
              : "border-gray-200 bg-white/50 hover:border-gray-300 hover:bg-gray-50/50"
        }`}
      >
        {!parsedData ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-2 font-medium">拖拽数据文件到此处</p>
            <p className="text-xs text-gray-400 mb-4">CSV · Excel · JSON 均可识别</p>
            <label>
              <input
                type="file"
                accept={acceptFormats}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button
                variant="outline"
                className="rounded-xl border-gray-200"
                disabled={isProcessing}
                type="button"
                onClick={(e) => {
                  (e.currentTarget as HTMLElement).parentElement?.querySelector("input")?.click();
                }}
              >
                {isProcessing ? "处理中..." : "选择文件"}
              </Button>
            </label>
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              {formatIcon(parsedData.format)}
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">{parsedData.fileName}</p>
            <p className="text-xs text-gray-500">
              {parsedData.totalRows} 行数据 · {parsedData.headers.length} 列 · {parsedData.format.toUpperCase()} 格式
            </p>
            <div className="flex items-center gap-2 justify-center mt-3">
              <button
                onClick={() => { setParsedData(null); setError(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> 重新选择
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Detected Metric */}
      {parsedData && selectedMetric && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-sm font-medium text-emerald-900">检测到指标: {selectedMetric}</p>
            <p className="text-xs text-emerald-700 mt-0.5">数据将自动映射到对应指标看板</p>
          </div>
        </div>
      )}
      {parsedData && !selectedMetric && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 flex items-center gap-3">
          <Upload className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-900">未检测到已知指标</p>
            <p className="text-xs text-amber-700 mt-0.5">将以文件名作为指标标签保存</p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {parsedData && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">数据预览</h3>
            <span className="text-xs text-gray-400">前 {Math.min(parsedData.rows.length, 5)} 行</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {parsedData.headers.map((h, i) => (
                    <th key={i} className="text-left font-medium text-gray-500 px-4 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 5).map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-50 last:border-0">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2 text-gray-700 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save */}
      {parsedData && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saved}
            className={`rounded-xl shadow-sm ${
              saved ? "bg-emerald-100 text-emerald-700" : "bg-gray-900 hover:bg-gray-800 text-white"
            }`}
          >
            {saved ? (<><Check className="mr-2 h-4 w-4" />已保存到看板</>) : (<><ArrowRight className="mr-2 h-4 w-4" />保存到看板</>)}
          </Button>
        </div>
      )}
    </div>
  );
}
