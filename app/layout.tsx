import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MainContent } from "@/components/layout/main-content";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { ToastContainer } from "@/components/shared/toast";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SyncManager } from "@/components/layout/sync-manager";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Pulse - AI产品与运营工作台",
  description:
    "产品经理和运营的AI原生工作台，覆盖需求、数据、用户、运营的全流程。支持 Word/PPT/CSV/Excel/Markdown/JSON 全格式导出，PDF/Word/Excel 文档解析，百万级数据分析。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('pulse_theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${jetbrainsMono.variable} bg-background`}>
        <ThemeProvider>
          <AuthProvider>
            <AuthGuard>
              <SyncManager />
              <Sidebar />
              <MainContent>{children}</MainContent>
              <MobileTabBar />
            </AuthGuard>
          </AuthProvider>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
