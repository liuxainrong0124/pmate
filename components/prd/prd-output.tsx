"use client";

import { PrdOutput, PrdSection } from "@/types";
import ReactMarkdown from "react-markdown";
import { Lightbulb, CheckCircle, AlertTriangle } from "lucide-react";

interface PrdOutputProps { output: PrdOutput; }

export function PrdOutputDisplay({ output }: PrdOutputProps) {
  return (
    <div className="space-y-4">
      {output.review && (
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/50 to-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold text-violet-900">AI 自审报告</h3>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
              output.review.score >= 7 ? "bg-emerald-100 text-emerald-700" :
              output.review.score >= 5 ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              评分 {output.review.score}/10
            </span>
          </div>
          {output.review.issuesFound.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">发现的问题</p>
              {output.review.issuesFound.map((issue, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-violet-700 mb-0.5 last:mb-0">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  {issue}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-violet-600 leading-relaxed">{output.review.reviewNotes}</p>
        </div>
      )}
      {(output.sections ?? []).map((section,i) => <SectionCard key={i} section={section} />)}
      {output.suggestions.length>0 && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-amber-900">关键决策点</h3>
          </div>
          <ul className="space-y-2">
            {output.suggestions.map((s,i)=>(
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: PrdSection }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {section.title && <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>}
      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
        <ReactMarkdown>{section.content}</ReactMarkdown>
      </div>
    </div>
  );
}
