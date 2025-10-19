import { AdminHeaderClient } from "./AdminHeaderClient";
import { getServerSession, getServerMediaDetail } from "@/lib/auth-server";
import { buildMediaUrl } from "@/lib/media-url";

export default async function AdminHeader() {
    // サーバー側でセッション情報を取得
    const session = await getServerSession();

    if (!session) {
        return null;
    }

    const { profile, accessToken } = session;

    // アバターメディア情報を取得
    let avatarUrl: string | null = null;
    if (profile.avatarMediaId) {
        const avatarMedia = await getServerMediaDetail(
            profile.avatarMediaId,
            accessToken
        );
        if (avatarMedia) {
            avatarUrl =
                avatarMedia.publicUrl ?? buildMediaUrl(avatarMedia.storageKey);
        }
    }

    return (
        <header className="bg-card border-b sticky top-0 z-50">
            <div className="max-w-7xl mx-auto pr-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <AdminHeaderClient
                        profile={profile}
                        avatarUrl={avatarUrl}
                    />
                </div>
            </div>
        </header>
    );
}
