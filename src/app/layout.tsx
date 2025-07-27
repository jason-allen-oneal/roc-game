import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { UserProvider } from "@/contexts/UserContext";
import { CityProvider } from "@/contexts/CityContext";

export const metadata: Metadata = {
  title: "Realms of Camelot",
  description: "A Next.js game with authentication, player management, and kingdom building features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-forest-gradient min-h-screen`}
      >
        <AuthProvider>
          <UserProvider>
            <PlayerProvider>
              <CityProvider>
                {children}
              </CityProvider>
            </PlayerProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
