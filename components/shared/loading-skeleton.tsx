"use client";

interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 5, className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 rounded-full bg-gray-200" />
        <div className="h-5 w-1/3 bg-gray-200 rounded-lg" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-3 last:mb-0">
          <div className="h-4 bg-gray-100 rounded-lg mb-2" style={{ width: `${60 + Math.random() * 35}%` }} />
          <div className="h-3 bg-gray-50 rounded-lg" style={{ width: `${40 + Math.random() * 45}%` }} />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded-full bg-gray-200" />
        <div className="h-5 w-32 bg-gray-200 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded-lg w-full" />
        <div className="h-4 bg-gray-100 rounded-lg w-5/6" />
        <div className="h-4 bg-gray-50 rounded-lg w-4/6" />
      </div>
    </div>
  );
}
