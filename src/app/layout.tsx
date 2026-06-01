import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hive Chess Arena",
  description: "High-performance autonomous chess engine node matrix.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-50">
      <body className="antialiased selection:bg-slate-200 text-slate-900">
        {children}
      </body>
    </html>
  );
}