"use client";

import { PrdOutput, PrdSection } from "@/types";
import ReactMarkdown from "react-markdown";

interface PrdOutputProps {
  output: PrdOutput;
}

export function PrdOutputDisplay({ output }: PrdOutputProps) {
  return (
    <div className="space-y-6">
      {output.sections.map((section, i) => (
        <SectionCard key={i} section={section} />
      ))}

      {output.suggestions.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-2">关键决策点</h3>
          <ul className="space-y-1">
            {output.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-amber-800">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: PrdSection }) {
  if (!section.title) {
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{section.content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-5">
      <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{section.content}</ReactMarkdown>
      </div>
    </div>
  );
}
