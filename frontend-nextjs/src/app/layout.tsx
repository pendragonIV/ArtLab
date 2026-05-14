import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/Providers";
import { LanguageProvider } from "@/contexts/LanguageContext";
import FloatingChat from "@/components/FloatingChat";
import SecurityWrapper from "@/components/SecurityWrapper";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "ArtLab | Master the Art of Digital Creation",
  description: "Join thousands of students learning from industry experts. Start creating today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <NextAuthProvider>
          <LanguageProvider>
            <SecurityWrapper />
            {children}
            <FloatingChat />
            <Analytics />
          </LanguageProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
