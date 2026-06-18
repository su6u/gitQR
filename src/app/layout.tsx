import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AgentationDev } from "@/components/agentation-dev";
import { AppProviders } from "@/components/providers";
import { boris, caveat } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const manrope = Manrope({
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
    <html
      lang="en"
      className={cn(
        "light font-sans antialiased",
        manrope.variable,
        boris.variable,
        caveat.variable,
      )}
      style={{ colorScheme: "light" }}
    >
      <body>
        <AppProviders>{children}</AppProviders>
        <AgentationDev />
      </body>
    </html>
  );
}
