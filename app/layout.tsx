import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoteTogether — Your shared space",
  description: "A calm shared space for notes, ideas, and plans."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}