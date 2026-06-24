import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/search/command-palette";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OpenFund — The home of open source funding",
    template: "%s | OpenFund",
  },
  description:
    "Discover projects, support maintainers, and build software together. Transparent crowdfunding for open source, powered by Stellar.",
  keywords: [
    "open source funding",
    "github crowdfunding",
    "stellar blockchain",
    "developer tools",
    "maintainer support",
    "USDC donations",
  ],
  openGraph: {
    type: "website",
    title: "OpenFund — The home of open source funding",
    description: "Transparent crowdfunding for open source, powered by Stellar.",
    siteName: "OpenFund",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFund — The home of open source funding",
    description: "Transparent crowdfunding for open source, powered by Stellar.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-white text-gray-900 antialiased min-h-screen">
        <Providers>
          <div className="relative bg-white">
            <Navbar />
            <main className="pt-14">{children}</main>
            <Footer />
            <CommandPalette />
          </div>
        </Providers>
      </body>
    </html>
  );
}
