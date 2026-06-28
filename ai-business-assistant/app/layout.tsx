import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://aibusiness.app"
  ),
  title: {
    default: "AI Business Assistant — Grow Faster with AI",
    template: "%s | AI Business Assistant",
  },
  description:
    "Generate content, write emails, create invoices, translate text, and more with AI. Save hours daily and scale your business.",
  keywords: [
    "AI business tools",
    "content generation",
    "email writer",
    "AI assistant",
    "business automation",
    "social media generator",
    "invoice generator",
  ],
  authors: [{ name: "AI Business Assistant" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "AI Business Assistant — Grow Faster with AI",
    description:
      "Generate content, write emails, create invoices, translate text, and more with AI.",
    siteName: "AI Business Assistant",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Business Assistant — Grow Faster with AI",
    description:
      "Generate content, write emails, create invoices and more with AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
