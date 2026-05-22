import "./globals.css";
import { Metadata } from "next";
import { Providers } from "./providers";
import { Geist } from "next/font/google";
import { Inter, Source_Serif_4 } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Confucius Forum",
  description: "礼楽",
};

/**
 * The root layout component for the entire application.
 * Defines the base HTML structure, global metadata, and wraps the application in the necessary providers.
 * @param children - The content of the current route.
 * @returns The top-level HTML structure for the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable, inter.variable, serif.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
