import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import UtmTracker from "@/components/marketing/UtmTracker";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Magang-ers | Platform Magang Terpercaya",
  description:
    "Platform magang terpercaya yang menghubungkan mahasiswa dengan kesempatan terbaik untuk belajar, berkembang, dan bersiap menghadapi dunia kerja.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body className="bg-white">
        <UtmTracker />
        {children}
      </body>
    </html>
  );
}