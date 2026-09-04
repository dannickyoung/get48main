import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./site.css";

// Root layout for the customer-facing website. The dashboard (admin + client)
// has its own root layout under app/(dashboard) with a separate design system.

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Get48",
  description: "Short-form video, on retainer.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
