import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Layout from "@/components/Layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lucian Saint Raffles",
  description: "A luxury raffle experience in the making.",
  icons: {
    icon: "/IMG_1176.png",
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
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
