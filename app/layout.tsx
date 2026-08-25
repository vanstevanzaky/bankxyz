import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BankXYZ — Internet Banking",
  description: "BankXYZ Internet Banking Portal — Kelola keuangan Anda dengan mudah dan aman",
  keywords: "bank, internet banking, keuangan, transfer, rekening",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full antialiased ${inter.variable} ${playfair.variable}`}>
      <body className={`min-h-full flex flex-col font-sans text-slate-800`}>{children}</body>
    </html>
  );
}
