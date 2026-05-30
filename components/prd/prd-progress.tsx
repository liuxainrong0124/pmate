"use client";

import { PrdProgress } from "@/types";

interface PrdProgressBarProps { progress: PrdProgress | null; }

export function PrdProgressBar({ progress }: PrdProgressBarProps) {
  if (!progress) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 rounded-xl border border-violet-100">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
      </span>
      <span className="text-sm text-violet-700 font-medium">{progress.message}</span>
    </div>
  );
}
