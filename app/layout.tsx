import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComicAI Studio",
  description: "AI-assisted text-to-comic creation workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
