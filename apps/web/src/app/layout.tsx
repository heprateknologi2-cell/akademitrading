import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SessionProvider } from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://akademitrading-id.netlify.app"),
  title: {
    default: "Akademitrading — Belajar Trading Berbasis Data",
    template: "%s — Akademitrading",
  },
  description: "Platform belajar trading saham Indonesia dengan kurikulum terstruktur, screener, dan analisis pasar berbasis data.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Akademitrading" },
  other: { "mobile-web-app-capable": "yes" },
  openGraph: {
    title: "Akademitrading — Belajar Trading Berbasis Data",
    description: "Kurikulum trading, screener, dan analisis saham Indonesia dalam satu platform.",
    type: "website",
    locale: "id_ID",
    siteName: "akademitrading",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "akademitrading" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Akademitrading — Screener & Signal Saham Indonesia",
    description: "Screener dan sinyal trading saham Indonesia real-time.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="application-name" content="Akademitrading" />
        <meta name="theme-color" content="#020817" />
      </head>
      <body className="flex min-h-full flex-col bg-[#020817] text-white">
        <SessionProvider>
          <a href="#main-content" className="fixed left-4 top-2 z-[60] -translate-y-20 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition-transform focus:translate-y-0">Lewati ke konten</a>
          <Navbar />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
