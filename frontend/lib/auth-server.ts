import { cookies } from "next/headers";
import { UserProfileResponse } from "@/lib/api/admin/users";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

/**
 * サーバーサイドで認証情報を取得。
 * アクセストークンが失効している場合はリフレッシュ処理を試行する。
 */
export async function getServerSession() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

    if (accessToken) {
        const profile = await fetchProfile(accessToken);
        if (profile) {
            return { accessToken, profile };
        }
    }

    if (!refreshToken) {
        return null;
    }

    const refreshed = await refreshTokens(refreshToken);
    if (!refreshed) {
        return null;
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        refreshed;
    const profile = await fetchProfile(newAccessToken);
    if (!profile) {
        return null;
    }

    // クッキーを最新化
    setCookie(cookieStore, ACCESS_COOKIE, newAccessToken);
    if (newRefreshToken) {
        setCookie(cookieStore, REFRESH_COOKIE, newRefreshToken);
    }

    return {
        accessToken: newAccessToken,
        profile,
    };
}

/**
 * プロフィール情報を取得
 */
async function fetchProfile(
    token: string
): Promise<UserProfileResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
        });
        if (!response.ok) {
            return null;
        }
        return (await response.json()) as UserProfileResponse;
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        return null;
    }
}

/**
 * トークンリフレッシュ
 */
async function refreshTokens(refreshToken: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken }),
            cache: "no-store",
        });

        if (!response.ok) {
            console.warn("Failed to refresh access token", response.status);
            return null;
        }

        const data = (await response.json()) as {
            accessToken: string;
            refreshToken?: string;
        };

        return data;
    } catch (error) {
        console.error("Refresh request failed:", error);
        return null;
    }
}

/**
 * クッキーを設定
 */
function setCookie(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
    name: string,
    value: string
) {
    try {
        cookieStore.set({
            name,
            value,
            httpOnly: true,
            path: "/",
            sameSite: "strict",
        });
    } catch (error) {
        console.warn("Failed to set cookie on server:", error);
    }
}

/**
 * サーバーサイドでメディア情報を取得
 */
export async function getServerMediaDetail(
    mediaId: number,
    accessToken: string
) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/media/${mediaId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.warn("Failed to get server media detail:", error);
        return null;
    }
}
