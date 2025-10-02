import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagSummary } from "@/lib/post-api";

interface TagBadgeProps {
    tag: TagSummary;
    clickable?: boolean;
}

// タグバッジコンポーネント（投稿一覧/詳細で使用）
export function TagBadge({ tag, clickable = true }: TagBadgeProps) {
    // クリックで投稿一覧のタグフィルタへ遷移
    const href = `/posts?tag=${encodeURIComponent(tag.slug)}`;

    // クリック可能な場合はリンク、不可の場合は通常のバッジ
    if (clickable) {
        return (
            <Link href={href}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                    #{tag.name}
                </Badge>
            </Link>
        );
    }

    return <Badge variant="secondary">#{tag.name}</Badge>;
}
