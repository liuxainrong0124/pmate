"use client";

import { PrdOutput, PrdSection } from "@/types";
import ReactMarkdown from "react-markdown";
import { Lightbulb } from "lucide-react";

interface PrdOutputProps { output: PrdOutput; }

export function PrdOutputDisplay({ output }: PrdOutputProps) {
  return (
    <div className="space-y-4">
      {output.sections.map((section,i) => <SectionCard key={i} section={section} />)}
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
