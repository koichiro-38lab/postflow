import { cookies } from "next/headers";
import { UserProfileResponse } from "@/lib/api/admin/users";

/**
 * サーバーサイドで認証情報を取得
 */
export async function getServerSession() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    if (!accessToken) {
        return null;
    }

    try {
        // バックエンドAPIからプロフィール情報を取得
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/me`,
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

        const profile: UserProfileResponse = await response.json();

        return {
            accessToken,
            profile,
        };
    } catch (error) {
        console.error("Failed to get server session:", error);
        return null;
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
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/media/${mediaId}`,
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
