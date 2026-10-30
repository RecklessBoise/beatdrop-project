import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { PlayerBar } from "@/components/player/PlayerBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "BeatDrop Project", template: "%s · BeatDrop Project" },
  description: "Écoute et télécharge les productions.",
  // Les dossiers sont privés : on ne veut pas qu'ils apparaissent dans les moteurs de recherche.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PlayerProvider>
          <div className="min-h-dvh pb-28">{children}</div>
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
