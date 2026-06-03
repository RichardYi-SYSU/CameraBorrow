import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "青朴工作室设备借还 Demo",
  description: "校内相机及摄影设备借还管理最小闭环演示",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
