import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitMate — Dépenses partagées",
  description: "Gérez simplement les dépenses partagées en couple.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
