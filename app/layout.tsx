import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/layout/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PMate - AI产品经理工作台",
  description: "面向产品经理的AI工作伴侣，让PM专注于思考和决策",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Nav />
        <main className="min-h-screen bg-gray-50">{children}</main>
      </body>
    </html>
  );
}
