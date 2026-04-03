import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";


export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Session next-auth présente → OK
        if (token) return true;

        // Fallback : vérifie le cookie tepenye_token (connexions email/OTP manuelles)
        // Ce cookie est écrit par l'AuthContext via document.cookie lors du login manuel.
        const tepenyeToken = req.cookies.get("tepenye_token")?.value;
        return !!tepenyeToken;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/publier/:path*",
    "/profil/:path*",
    "/onboarding/:path*",
    "/favoris/:path*",
  ],
};