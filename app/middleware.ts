// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Specify the paths to protect
export const config = {
  matcher: ["/pengiriman/*", "http://localhost:3000/", "/"], // Change this to match your protected routes
};
