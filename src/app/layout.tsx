import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartProvider } from "@/context/CartContext";
import Layout from "@/components/Layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.saintarchive.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Saint Archive",
  description: "Authentic luxury streetwear, sneakers, and accessories.",
  icons: {
    icon: "/IMG_1176.png",
    shortcut: "/IMG_1176.png",
    apple: "/IMG_1176.png",
  },
  openGraph: {
    title: "Saint Archive",
    description: "Authentic luxury streetwear, sneakers, and accessories.",
    url: baseUrl,
    siteName: "Saint Archive",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Saint Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saint Archive",
    description: "Authentic luxury streetwear, sneakers, and accessories.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} bg-[#050509] text-[#f5f5f5] antialiased`}>
        <CartProvider>
          <Layout>{children}</Layout>
        </CartProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
