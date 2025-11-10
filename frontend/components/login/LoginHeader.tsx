"use client";

import Link from "next/link";
import { PostFlowIcon } from "@/components/ui/postflow-icon";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Header() {
    return (
        <header className="bg-card border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/">
                        <PostFlowIcon />
                    </Link>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </header>
    );
}
