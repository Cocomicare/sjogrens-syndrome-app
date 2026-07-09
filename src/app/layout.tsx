import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevDisclaimerBanner } from "@/components/layout/DevDisclaimerBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sjögren's Signal",
  description: "Symptom tracking between visits for pediatric Sjögren's syndrome patients.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <DevDisclaimerBanner />
        {children}
      </body>
    </html>
  );
}
