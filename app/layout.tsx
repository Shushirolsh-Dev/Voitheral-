import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOITHREAL — Your voice. Your intelligence. Your life.",
  description: "A calm, voice-first personal companion that helps you care for yourself and stay on track.",
  applicationName: "VOITHREAL",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VOITHREAL" }
};

export const viewport: Viewport = {
  themeColor: "#0a1017",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
