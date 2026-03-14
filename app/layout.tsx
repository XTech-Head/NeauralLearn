import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import Provider from "./provider";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "NeuralLearn",
  description: "AI-powered course generator",
  // No manifest here — Next.js picks it up automatically from app/manifest.ts
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeuralLearn",
  },
  icons: {
    icon: [
      { url: "/icons/icon-16.png", sizes: "16x16" },
      { url: "/icons/icon-32.png", sizes: "32x32" },
    ],
    apple: "/icons/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Provider>{children}</Provider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}