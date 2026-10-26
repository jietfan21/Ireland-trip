import type { Metadata, Viewport } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "爱尔兰之旅 · Ireland Trip",
  description: "潘家 13 天爱尔兰自驾 · Fan family 13-day Ireland road trip",
  manifest: "/manifest.webmanifest?v=family-1",
  appleWebApp: { capable: true, title: "Ireland", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/family-favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/family-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/family-favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/family-favicon.ico",
    apple: { url: "/family-apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f7a5a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hans">
      <body className="antialiased">{children}</body>
    </html>
  );
}

