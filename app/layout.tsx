import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrepWise - AI-Powered Interview Preparation",
  description: "Practice interviews with AI, get ATS scores, and improve your resume",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
