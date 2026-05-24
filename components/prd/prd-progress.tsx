"use client";

import { PrdProgress } from "@/types";

interface PrdProgressBarProps {
  progress: PrdProgress | null;
}

export function PrdProgressBar({ progress }: PrdProgressBarProps) {
  if (!progress) return null;

  return (
    <div className="flex items-center gap-2 py-3 px-4 bg-blue-50 rounded-lg text-sm text-blue-700">
      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span>{progress.message}</span>
    </div>
  );
}
