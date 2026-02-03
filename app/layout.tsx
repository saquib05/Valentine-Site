import type { Metadata } from "next";
import { Pacifico } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico" });

export const metadata: Metadata = {
  title: "Valentine's Proposal",
  description: "Create your Valentine's proposal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pacifico.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
