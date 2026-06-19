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

const siteDescription = "Your green squares, but someone can scan them";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GitQR",
    template: "%s · GitQR",
  },
  description: siteDescription,
  applicationName: "GitQR",
  keywords: [
    "github",
    "qr code",
    "contribution graph",
    "git contributions",
    "green squares",
  ],
  authors: [{ name: "su6u", url: "https://github.com/su6u" }],
  creator: "su6u",
  icons: {
    icon: [
      { url: "/images/favicon.ico" },
      {
        url: "/images/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/images/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/images/apple-touch-icon.png",
  },
  manifest: "/images/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "GitQR",
    title: "GitQR",
    description: siteDescription,
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 600,
        alt: "GitQR preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitQR",
    description: siteDescription,
    images: ["/images/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
