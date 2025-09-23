import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Admin routes require authentication
    if (pathname.startsWith("/admin")) {
        const accessToken =
            request.cookies.get("accessToken")?.value ||
            request.headers.get("cookie")?.match(/accessToken=([^;]+)/)?.[1];

        if (!accessToken) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
