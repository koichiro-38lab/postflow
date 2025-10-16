import Link from "next/link";
import { TagPublic } from "@/features/public/types";
import { Badge } from "@/components/ui/badge";

interface TagCloudProps {
    tags: TagPublic[];
}

export default function TagCloud({ tags }: TagCloudProps) {
    // 投稿数で降順ソート
    const sortedTags = [...tags].sort((a, b) => b.postCount - a.postCount);

    // 投稿数に応じてサイズクラスを割り当て
    const maxCount = Math.max(...tags.map((t) => t.postCount), 1);
    const minCount = Math.min(...tags.map((t) => t.postCount), 1);

    const getSizeClass = (count: number) => {
        const ratio = (count - minCount) / (maxCount - minCount || 1);

        if (ratio > 0.8) return "text-2xl";
        if (ratio > 0.6) return "text-xl";
        if (ratio > 0.4) return "text-lg";
        if (ratio > 0.2) return "text-base";
        return "text-sm";
    };

    return (
        <div className="flex flex-wrap gap-3 items-center justify-center">
            {sortedTags.map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`} className="group">
                    <Badge
                        variant="outline"
                        className={`${getSizeClass(tag.postCount)} 
                            hover:border-primary hover:text-primary 
                            transition-colors cursor-pointer px-4 py-2`}
                    >
                        {tag.name}
                    </Badge>
                </Link>
            ))}
        </div>
    );
}
