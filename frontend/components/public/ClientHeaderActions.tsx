/**
 * 公開ヘッダーのクライアントサイドアクション（モバイルメニュー）
 */

"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";
import { CategoryPublic } from "@/features/public/types";

interface ClientHeaderActionsProps {
    topLevelCategories: CategoryPublic[];
}

export function ClientHeaderActions({
    topLevelCategories,
}: ClientHeaderActionsProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">メニューを開く</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <SheetTitle>メニュー</SheetTitle>
                <nav className="flex flex-col space-y-4 mt-6">
                    {/* 1階層目のカテゴリを動的に表示 */}
                    {topLevelCategories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="font-medium transition-colors hover:text-primary"
                            onClick={() => setIsOpen(false)}
                        >
                            {category.name}
                        </Link>
                    ))}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
