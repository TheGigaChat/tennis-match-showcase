import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import MswInit from "./msw-init";
import "./globals.css";
import OnboardingGuard from "@/components/OnboardingGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TennisMatch",
  description: "Find your tennis partner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Use Inter as the sans font for Tailwind */}
      <body className={`${inter.variable} font-sans`}>
        {/* <MswInit /> */}
        <OnboardingGuard />
        {children}
      </body>
    </html>
  );
}
