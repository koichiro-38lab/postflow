import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// JWT ペイロードをデコード（簡易版）
function decodeJWT(token: string): { role?: string; roles?: string[] } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf-8")
        );
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Admin routes require authentication
    if (pathname.startsWith("/admin")) {
        // ログインページは除外
        if (pathname === "/login") {
            return NextResponse.next();
        }

        const accessToken =
            request.cookies.get("accessToken")?.value ||
            request.headers.get("cookie")?.match(/accessToken=([^;]+)/)?.[1];

        console.log("[Middleware] pathname:", pathname);
        console.log("[Middleware] accessToken found:", !!accessToken);

        if (!accessToken) {
            console.log("[Middleware] No token, redirecting to /login");
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // JWT からロールを取得（roles配列の最初の要素を使用）
        const payload = decodeJWT(accessToken);
        const userRole = payload?.roles?.[0] || payload?.role;

        console.log("[Middleware] JWT payload:", payload);
        console.log("[Middleware] userRole:", userRole);

        if (!userRole) {
            // ロール情報がない場合はログインページへ
            console.log("[Middleware] No role found, redirecting to /login");
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // AUTHOR の制限: カテゴリ・タグページへのアクセスを禁止
        if (userRole === "AUTHOR") {
            if (
                pathname.startsWith("/admin/categories") ||
                pathname.startsWith("/admin/tags") ||
                pathname.startsWith("/admin/users")
            ) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
        }

        // EDITOR の制限: ユーザー管理ページへのアクセスを禁止
        if (userRole === "EDITOR") {
            if (pathname.startsWith("/admin/users")) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
        }

        // ADMIN は全てのページにアクセス可能
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
