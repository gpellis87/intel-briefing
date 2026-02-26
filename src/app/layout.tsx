import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { BookmarkProvider } from "@/context/BookmarkContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intel Briefing | News Command Center",
  description:
    "A sophisticated intelligence-style news aggregator with bias analysis and multi-perspective coverage.",
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Inter,sans-serif]">
        <ThemeProvider>
          <BookmarkProvider>{children}</BookmarkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
