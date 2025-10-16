import { Metadata } from "next";
import TagCloud from "@/components/public/TagCloud";
import { getPublicTags } from "@/lib/api/public";

export const metadata: Metadata = {
    title: "タグ一覧",
    description: "記事をタグ別に探す",
};

export default async function TagsPage() {
    // タグ一覧を取得
    const tags = await getPublicTags();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mt-8 mb-2">タグ一覧</h1>
            </div>

            {tags.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    タグがまだありません
                </div>
            ) : (
                <div className="mb-8">
                    <TagCloud tags={tags} />
                </div>
            )}
        </div>
    );
}
