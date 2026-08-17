import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "InvoiceAI — فواتير احترافية بمساعدة الذكاء الاصطناعي",
    template: "%s · InvoiceAI",
  },
  description:
    "InvoiceAI هي منصة إنشاء وإدارة الفواتير وعروض الأسعار لأصحاب المشاريع الصغيرة، مع مساعد ذكاء اصطناعي يبني بنود الفاتورة من جملة واحدة.",
};

// TODO(phase: i18n/dashboard-layout): replace this static ar/rtl default with
// real locale routing + a language switcher persisting to profiles.language.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${inter.variable} ${plexArabic.variable}`}
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
