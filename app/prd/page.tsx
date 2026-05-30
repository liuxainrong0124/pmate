"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function PrdRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", "prd");
    searchParams.forEach((value, key) => params.set(key, value));
    router.replace(`/requirements?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
    </div>
  );
}

export default function PrdPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-10"><div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl" /></div>}>
      <PrdRedirect />
    </Suspense>
  );
}
