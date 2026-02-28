import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eqbis — All-in-One Business Platform",
    template: "%s | Eqbis",
  },
  description:
    "The all-in-one SaaS platform for modern teams. HR, Finance, CRM, Projects, and more — unified in one workspace.",
  metadataBase: new URL("https://eqbis.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eqbis.com",
    siteName: "Eqbis",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "font-sans antialiased min-h-screen"
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
