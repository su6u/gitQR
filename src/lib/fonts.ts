import { Caveat } from "next/font/google";
import localFont from "next/font/local";

export const boris = localFont({
  src: "../../public/fonts/Boris.woff2",
  variable: "--font-boris",
  display: "swap",
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-caveat",
  display: "swap",
});
