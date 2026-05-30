"use client";

import { usePathname } from "next/navigation";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <main className={`min-h-screen transition-[margin] duration-300 max-md:pb-16 ${
      isLanding ? "ml-0" : "ml-[224px] max-md:ml-0"
    }`}>
      {children}
    </main>
  );
}
