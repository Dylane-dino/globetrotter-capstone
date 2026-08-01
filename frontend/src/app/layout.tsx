import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import TripAiChat from "@/components/TripAiChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlobeTrotter | Your Yaoundé, planned",
  description:
    "A travel recommendation assistant for Yaoundé, Cameroon - search destinations, get personalized picks, and plan your itinerary.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-ivory text-ink antialiased">
        <AuthProvider>{children}<TripAiChat /></AuthProvider>
      </body>
    </html>
  );
}
