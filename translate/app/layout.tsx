"use client";

import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SonnerProvider } from "@/components/sonner-provider";
import ErrorBoundary from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

// Move metadata to a separate file to avoid hydration errors
const metadata = {
  title: "Language Learning PWA",
  description: "Translate and practice with flashcards",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="LangLearn" />
        <meta name="mobile-web-app-capable" content="yes"></meta>
        <meta
          name="viewport"
          content="width=device-width; initial-scale=1; viewport-fit=cover"
        ></meta>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href={metadata.manifest} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ErrorBoundary>{children}</ErrorBoundary>
          <SonnerProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
