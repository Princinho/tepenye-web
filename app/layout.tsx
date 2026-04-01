"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { APIProvider } from "@vis.gl/react-google-maps";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/AuthContext";
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
        {/*
         * SessionProvider doit envelopper tout ce qui utilise useSession().
         * Il est placé ici, en dehors de AuthProvider, pour que ce dernier
         * puisse appeler useSession() via le hook useAuthContext.
         */}
        <SessionProvider>
          <APIProvider
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
            libraries={["places", "geocoding"]}
          >
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <Navbar />
                <main className="max-w-[1400px] mx-auto px-4 py-6">
                  {children}
                </main>
                <ReactQueryDevtools initialIsOpen={false} />
              </AuthProvider>
            </QueryClientProvider>
          </APIProvider>
        </SessionProvider>
      </body>
    </html>
  );
}