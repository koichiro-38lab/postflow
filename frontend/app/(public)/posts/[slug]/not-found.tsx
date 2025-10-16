import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
            <h1 className="text-6xl font-bold text-muted-foreground mb-4">
                404
            </h1>
            <h2 className="text-2xl font-semibold mb-2">
                記事が見つかりません
            </h2>
            <p className="text-muted-foreground mb-8">
                お探しの記事は削除されたか、URLが間違っている可能性があります。
            </p>
            <Button asChild>
                <Link href="/posts" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    記事一覧に戻る
                </Link>
            </Button>
        </div>
    );
}
