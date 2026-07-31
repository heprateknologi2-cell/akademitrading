import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;

  const protectedRoutes = ["/dashboard", "/subscription", "/portfolio"];
  const isProtected = protectedRoutes.some(r => path.startsWith(r));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/subscription/:path*", "/portfolio/:path*"],
};
