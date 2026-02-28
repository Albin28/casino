import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Reels Casino",
  description: "The ultimate slot machine simulator – spin to win with fake chips!",
  keywords: ["casino", "slot machine", "jackpot", "lucky reels", "simulator"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
