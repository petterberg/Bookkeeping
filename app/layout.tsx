import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { ToastHost } from "@/components/ui/Toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Räkna — bokföring för småföretagare",
  description: "En lugn plats för dig och din revisor.",
};

export const viewport: Viewport = {
  themeColor: "#f5f2ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sv"
      className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        <AppProvider>
          {children}
          <ToastHost />
        </AppProvider>
      </body>
    </html>
  );
}
