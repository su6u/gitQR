import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AgentationDev } from "@/components/agentation-dev";
import { AppProviders } from "@/components/providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "git-qr",
  description: "Git QR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans antialiased", inter.variable)}>
      <body>
        <AppProviders>{children}</AppProviders>
        <AgentationDev />
      </body>
    </html>
  );
}
