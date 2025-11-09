// filepath: frontend/features/admin/posts/utils/derive-publication-state.ts
import { Post, PublicationState } from "@/lib/types/common";

type PublicationTarget = Pick<Post, "status" | "publishedAt">;

/**
 * 投稿の公開状態（予約公開含む）を算出
 */
export function derivePublicationState(
    post: PublicationTarget,
    now: Date = new Date()
): PublicationState {
    if (post.status === "PUBLISHED" && post.publishedAt) {
        // 公開日時のDate変換
        const publishedAtDate = new Date(post.publishedAt);
        if (publishedAtDate.getTime() > now.getTime()) {
            return "SCHEDULED";
        }
        return "PUBLISHED";
    }

    return post.status;
}
