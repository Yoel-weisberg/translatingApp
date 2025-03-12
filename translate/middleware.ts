import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Make sure your middleware isn't blocking access to static files
  if (request.nextUrl.pathname.includes("/icon-192.png")) {
    console.log("Middleware: allowing access to icon")
    return NextResponse.next()
  }

  // Rest of your middleware logic
  return NextResponse.next()
}

// Make sure this doesn't include paths to your static files
export const config = {
  matcher: [
    // Add your matchers here, but exclude static files
    "/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png).*)",
  ],
}

