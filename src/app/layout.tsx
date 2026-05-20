import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "ExtrairLeads | Dashboard Neural",
  description: "Motor neural de prospecção ativa.",
  icons: {
    icon: "/scraping.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground selection:bg-emerald-500/20 antialiased`}>
        <SmoothScrollProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}