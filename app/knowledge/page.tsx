"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { getDocs, addDoc, deleteDoc, StoredDoc } from "@/lib/store/local-store";
import type { ParsedFile } from "@/lib/parsers/file-parser";
import {
  Search, BookOpen, FileText, Link2, Upload, Sparkles,
  Clock, Download, Brain, Trash2, Plus
} from "lucide-react";

function typeIcon(type: string) {
  switch (type) {
    case "prd": return <FileText className="w-4 h-4 text-violet-500" />;
    case "report": return <BookOpen className="w-4 h-4 text-emerald-500" />;
    case "guide": return <Brain className="w-4 h-4 text-amber-500" />;
    case "data": return <FileText className="w-4 h-4 text-blue-500" />;
    default: return <Link2 className="w-4 h-4 text-gray-400" />;
  }
}

function typeLabel(type: string) {
  switch (type) {
    case "prd": return "PRD";
    case "report": return "报告";
    case "guide": return "指南";
    case "data": return "数据";
    case "external": return "外部";
    default: return "文档";
  }
}

function guessType(name: string, format: string): StoredDoc["type"] {
  const lower = name.toLowerCase();
  if (lower.includes("prd") || lower.includes("需求")) return "prd";
  if (lower.includes("报告") || lower.includes("分析") || lower.includes("report")) return "report";
  if (lower.includes("指南") || lower.includes("guide") || lower.includes("策略")) return "guide";
  if (format === "csv" || format === "xlsx" || format === "json") return "data";
  return "external";
}

function summary(text: string): string {
  return text.slice(0, 120).replace(/\n/g, " ") + (text.length > 120 ? "…" : "");
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDocs(getDocs());
    setLoaded(true);
  }, []);

  const refresh = () => setDocs(getDocs());

  const handleFilesParsed = (files: ParsedFile[]) => {
    for (const f of files) {
      const ext = f.type || f.name.split(".").pop() || "txt";
      const tags = extractTags(f.name, f.text);
      addDoc({
        id: "",
        title: f.name.replace(/\.[^.]+$/, ""),
        content: f.text,
        type: guessType(f.name, ext),
        category: "",
        tags,
        format: ext,
        updatedAt: new Date().toISOString().slice(0, 10),
      });
    }
    setUploadOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteDoc(id);
    refresh();
    setDeleteId(null);
  };

  const filtered = docs.filter((d) => {
    if (search && !d.title.includes(search) && !summary(d.content).includes(search) && !d.tags.some(t => t.includes(search))) return false;
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: docs.length,
    formats: new Set(docs.map(d => d.format)).size,
    weekNew: docs.filter(d => {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      return new Date(d.updatedAt) >= d7;
    }).length,
  };

  if (!loaded) return null;

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-8 relative">
      {/* Module tint bar */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-amber-200/60 dark:from-amber-500/15 to-transparent pointer-events-none" />
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">知识库</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">文档管理、智能检索、知识沉淀</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索文档、标签、摘要..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "prd", "report", "guide", "data"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === t ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {t === "all" ? "全部" : typeLabel(t)}
            </button>
          ))}
        </div>
        <Button onClick={() => setUploadOpen(true)} className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white shadow-sm text-sm">
          <Plus className="w-4 h-4 mr-1.5" /> 上传文档
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6 animate-fade-in">
        {[
          { label: "文档总数", value: String(stats.total), icon: FileText, color: "text-violet-500", bg: "bg-violet-50", darkBg: "dark:bg-violet-500/10" },
          { label: "支持格式", value: stats.formats + " 种", icon: Upload, color: "text-emerald-500", bg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/10" },
          { label: "本周新增", value: String(stats.weekNew), icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50", darkBg: "dark:bg-blue-500/10" },
          { label: "可搜索", value: "全文检索", icon: Brain, color: "text-amber-500", bg: "bg-amber-50", darkBg: "dark:bg-amber-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.darkBg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Doc List */}
      <div className="space-y-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                {typeIcon(doc.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">{doc.title}</h3>
                  <Badge className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-normal">{typeLabel(doc.type)}</Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{summary(doc.content)}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{doc.updatedAt}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />.{doc.format}</span>
                  <div className="flex gap-1">
                    {doc.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDeleteId(doc.id)}
                className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0 mt-1 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && docs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-white dark:to-gray-900 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">上传文档构建知识库</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            支持 PDF · Word · Excel · CSV · Markdown · TXT，AI 自动解析、摘要、索引。
          </p>
          <Button onClick={() => setUploadOpen(true)} className="rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900 text-white shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" /> 上传文档
          </Button>
        </div>
      )}

      {filtered.length === 0 && docs.length > 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 p-12 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">没有找到匹配的文档</p>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>上传文档</DialogTitle>
          </DialogHeader>
          <FileDropzone onFilesParsed={handleFilesParsed} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUploadOpen(false)} className="rounded-xl">关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 dark:text-gray-400">此操作不可撤销，确定要删除该文档吗？</p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">取消</Button>
            <Button onClick={() => deleteId && handleDelete(deleteId)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function extractTags(name: string, text: string): string[] {
  const tags: string[] = [];
  const all = (name + " " + text.slice(0, 500)).toLowerCase();
  const mapping: [string, string][] = [
    ["prd", "PRD"], ["需求", "需求文档"], ["用户", "用户"],
    ["竞品", "竞品"], ["数据", "数据"], ["运营", "运营"],
    ["推送", "推送"], ["画像", "用户画像"], ["异常", "异常场景"],
    ["分析", "分析"], ["报告", "报告"], ["指南", "指南"],
  ];
  for (const [kw, tag] of mapping) {
    if (all.includes(kw) && !tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 4);
}
