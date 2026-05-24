"use client";

import { useState } from "react";
import { PrdInput } from "@/components/prd/prd-input";
import { PrdOutputDisplay } from "@/components/prd/prd-output";
import { PrdProgressBar } from "@/components/prd/prd-progress";
import { PrdInput as PrdInputType, PrdOutput, PrdProgress } from "@/types";
import { parsePrdResponse } from "@/lib/ai/parsers/prd-parser";
import ReactMarkdown from "react-markdown";
import { ExportButton } from "@/components/shared/export-button";

export default function PrdPage() {
  const [output, setOutput] = useState<PrdOutput | null>(null);
  const [progress, setProgress] = useState<PrdProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");

  const handleSubmit = async (input: PrdInputType) => {
    setIsLoading(true);
    setError(null);
    setOutput(null);
    setProgress(null);
    setRawText("");

    try {
      const res = await fetch("/api/prd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              setProgress(data.progress);
            } else if (data.type === "chunk") {
              fullText += data.content;
              setRawText(fullText);
            } else if (data.type === "done") {
              const parsed = parsePrdResponse(fullText);
              setOutput(parsed);
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">PRD智能助手</h1>
      <p className="text-gray-500 mb-6">
        输入需求要点，AI 自动生成结构化PRD文档
      </p>

      <PrdInput onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mt-4">
        <PrdProgressBar progress={progress} />
      </div>

      {isLoading && rawText && (
        <div className="mt-6 prose prose-sm max-w-none border rounded-lg p-5">
          <ReactMarkdown>
            {rawText.replace(/---PROGRESS---/g, "")}
          </ReactMarkdown>
        </div>
      )}

      {output && (
        <>
          <div className="flex items-center justify-between mt-8 mb-4">
            <h2 className="text-lg font-semibold">生成的PRD</h2>
            <ExportButton
              content={output.fullMarkdown}
              filename={`prd-${Date.now()}.md`}
              label="导出Markdown"
            />
          </div>
          <PrdOutputDisplay output={output} />
        </>
      )}
    </div>
  );
}
