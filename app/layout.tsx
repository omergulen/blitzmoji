import type { Metadata } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const SITE = "https://blitzmoji.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Blitzmoji — every Slack emoji, found at the speed of light",
  description:
    "Search thousands of Slack-style and Unicode emoji instantly. Copy, download, and grab the :shortcode: in one keystroke. No login.",
  keywords: ["slack emoji", "slackmojis", "emoji search", "party parrot", "custom emoji"],
  openGraph: {
    title: "Blitzmoji",
    description: "Every Slack emoji, found at the speed of light.",
    url: SITE,
    siteName: "Blitzmoji",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Blitzmoji", description: "Every Slack emoji, found at the speed of light." },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
