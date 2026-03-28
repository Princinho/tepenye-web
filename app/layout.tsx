"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { APIProvider } from "@vis.gl/react-google-maps";
import { queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/Navbar";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}>
          <QueryClientProvider client={queryClient}>
            <Navbar />
            <main className="max-w-[1400px] mx-auto px-4 py-6">
              {children}
            </main>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </APIProvider>
      </body>
    </html>
  );
}