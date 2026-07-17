import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { Providers } from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "MUTAN Cooperative",
  description:
    "Muslim Teachers Association of Nigeria Cooperative — Member Portal",
  manifest: "/manifest.json",

  // ── iOS PWA support ───────────────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    title: "MUTAN",
    statusBarStyle: "black-translucent", // makes status bar overlay the green header
    startupImage: [
      // iPhone 14 Pro Max
      {
        url: "/splash.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone 14 / 13 / 12
      {
        url: "/splash.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      // iPhone SE
      {
        url: "/splash.png",
        media:
          "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      // Generic fallback
      { url: "/splash.png" },
    ],
  },

  // ── Favicon / browser tab ─────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [{ rel: "mask-icon", url: "/icon-512.png", color: "#0F5132" }],
  },

  // ── Android / Windows tile ────────────────────────────────────────────────
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0F5132",
    "msapplication-TileImage": "/icon-144.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F5132" },
    { media: "(prefers-color-scheme: dark)", color: "#0F5132" },
  ],
  viewportFit: "cover", // critical — allows content to go edge-to-edge behind notch
};

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body>
//         <Providers>{children}</Providers>
//       </body>
//     </html>
//   )
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        {/* Service Worker registration */}
        <Script src="/sw-register.js" strategy="afterInteractive" />
        {/* Paystack inline checkout — used by the "Pay Direct" flow */}
        <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
