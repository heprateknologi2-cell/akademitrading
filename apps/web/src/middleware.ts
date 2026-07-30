import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;
  const tier = req.auth?.user?.tier || "free";

  const proRoutes = ["/dashboard", "/subscription"];
  const isProRoute = proRoutes.some(r => path.startsWith(r));

  if (isProRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*"],
};
