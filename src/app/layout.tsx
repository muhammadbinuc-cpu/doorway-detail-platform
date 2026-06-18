import type { Metadata, Viewport } from "next";
import { Montserrat, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

import { requireValidEnv } from "@/lib/env-validator";
requireValidEnv();

const montserrat = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Doorway Detail | Exterior Home Detailing Across the GTA",
  description:
    "Window cleaning, pressure washing, gutter cleaning, landscaping, and full exterior packages across the GTA. Free estimates and easy online quotes.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A227",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${dmSans.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
