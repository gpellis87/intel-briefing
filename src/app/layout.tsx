import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { BookmarkProvider } from "@/context/BookmarkContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intel Briefing | News Command Center",
  description:
    "A sophisticated intelligence-style news aggregator with bias analysis and multi-perspective coverage.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Intel Briefing",
  },
};

export const viewport: Viewport = {
  themeColor: "#22d3ee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="midnight" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:opsz,wght@14..32,300..700&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="font-[Inter,sans-serif]">
        <ThemeProvider>
          <BookmarkProvider>{children}</BookmarkProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  );
}
