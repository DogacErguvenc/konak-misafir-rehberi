import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Konak — İyi ev sahipliğinin dijital hali", template: "%s | Konak" },
  description:
    "Villa ve bungalovunuza özel dijital misafir rehberi. Wi-Fi, ev talimatları ve çevre önerileri tek bir QR kodda.",
  applicationName: "Konak",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Konak" },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#12221e" },
  ],
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
