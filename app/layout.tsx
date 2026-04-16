import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "drwho.me — network + dev tools", template: "%s — drwho.me" },
  description: "Minimal, fast network and developer tools. No signup.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://drwho.me"),
  openGraph: {
    siteName: "drwho.me",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-content mx-auto px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
