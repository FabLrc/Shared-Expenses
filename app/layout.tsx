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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
