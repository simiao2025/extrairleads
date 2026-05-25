import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import VersionMonitor from "@/components/VersionMonitor";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground selection:bg-emerald-500/20 antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            {children}
            <VersionMonitor />
            <Toaster richColors closeButton />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
