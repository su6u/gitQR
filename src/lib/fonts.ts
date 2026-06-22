import localFont from "next/font/local";

export const openRunde = localFont({
  src: [
    {
      path: "../../public/fonts/OpenRunde-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/OpenRunde-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/OpenRunde-Semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/OpenRunde-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

/** Canvas/SVG export — must match the family name inside the font files. */
export const OPEN_RUNDE_FAMILY = "Open Runde";

export const kookyCloud = localFont({
  src: "../../public/fonts/Hello-KookyCloud.otf",
  variable: "--font-kooky",
  display: "swap",
});
