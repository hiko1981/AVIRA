import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

// EXCLUDE /t/<token> from middleware matching
export const config = {
  matcher: [
    "/((?!t/).*)",
  ],
};
